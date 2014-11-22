if(typeof String.prototype.trim !== 'function'){String.prototype.trim = function() {return this.replace(/^\s+|\s+$/g, '');};};

var taskManager = (function(){
	var tasks = {} //tasks holder
	,tasksContainerRef = {} //holds references for list DOM containers
	,taskListContainer = document.getElementById('task_lists')
	,list_selector = document.getElementById("list_selector") //dropdown selector for task type
	,actions = null;

	//add task related html to respective column
	function paintTask(type,value,pos){
		var task_wrapper = document.createElement("div")
			,html = '<input type="text" value="'+value+'" class="task-editable"/>'
			+'<a href="#" class="delete">Delete</a><a href="#" class="save">Save</a><a href="#" class="cancel">Cancel</a>';

		task_wrapper.setAttribute("data-index",pos);
		task_wrapper.setAttribute("data-type",type);
		
		task_wrapper.innerHTML = html;
		task_wrapper.className = "task";

		tasksContainerRef["list-"+type].insertBefore(task_wrapper, tasksContainerRef["list-"+type].firstChild);

		addDraggableEvents(task_wrapper, type,pos);
	}

	//attach draggable events
	function addDraggableEvents(node,type,pos){
		node.setAttribute('draggable', 'true');

		addEvent(node, 'dragstart', function (e) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('type', type);
			e.dataTransfer.setData('pos', pos);
		});
	}

	//attach drop events
	function addDroppableEvents(node){
		addEvent(node, 'dragover', function (e) {
		if (e.preventDefault) e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			return false;
		});

		addEvent(node, 'drop', function (e) {
			if (e.stopPropagation) e.stopPropagation(); // stops the browser from redirecting...why???

			var type = e.dataTransfer.getData('type')
				,pos = parseInt(e.dataTransfer.getData('pos'))
				,el = document.querySelector('[data-type="'+type+'"][data-index="'+pos+'"]')
				,value = actions.getTask(type,pos)
				,newtype = this.parentNode.getAttribute("data-type").slice(5);

			if(newtype == type)
				return;

			actions.delete(type,pos);

			el.parentNode.removeChild(el);

			actions.addTask(this.parentNode.getAttribute("data-type").slice(5),value);

			//update tasks of old stack
			for(var i = pos,len = tasks["list-"+type].length;i < len;i++){
				try{
					document.querySelector('[data-type="'+type+'"][data-index="'+ (i + 1) +'"]').setAttribute("data-index",i);
				}catch(e){}
			}

			return false;
		});
	}

	actions = {
		//add new task type
		addList: function(type){
			if(!("list-"+type in tasks)){
				tasks["list-"+type] = [];

				var wrapper = document.createElement("div")
					,opt = document.createElement("option")
					,html = '<h5>'+ type +'</h5><div class="tasks-container">';

				wrapper.setAttribute("data-type","list-"+type);
				
				wrapper.innerHTML = html;
				wrapper.className = "task-list";

				taskListContainer.appendChild(wrapper);

				tasksContainerRef["list-"+type] = wrapper.querySelector("div");

				addDroppableEvents(tasksContainerRef["list-"+type]);

				opt.innerHTML = type;
				opt.setAttribute("value",type);

				list_selector.appendChild(opt);
			}
		}
		//add new task
		,addTask: function(type,value){
			if(!("list-"+type in tasks))
				this.addList(type);

			var len = tasks["list-"+type].length;

			tasks["list-"+type].push({
				value : value
			});

			paintTask(type,value, len)

			return len;
		}
		//get description of a task
		,getTask: function(type,num){console.log(type,num);
			if(!("list-"+type in tasks) || num < 0 || num >= tasks.length)
				return false;

			return tasks["list-"+ type][num].value;
		}
		//delete an existing task
		,delete: function(type,num){
			if(num < 0 || num >= tasks.length)
				return false;

			tasks["list-" + type].splice(num,1);
			return true;
		}
		//update and existing task
		,update: function(value,type,num){
			if(num < 0 || num >= tasks.length)
				return false;

			tasks["list-" + type][num].value = value;
			return true;
		}
		,get: function(){
			return tasks
		}
	};

	return actions;
})();

//populating initial tasks
taskManager.addList("Todo");
taskManager.addList("Doing");
taskManager.addList("Done");

taskManager.addTask("Todo","Todo 1");
taskManager.addTask("Todo","Todo 2");
taskManager.addTask("Todo","Todo 3");

taskManager.addTask("Doing","Doing 1");
taskManager.addTask("Doing","Doing 2");
taskManager.addTask("Doing","Doing 3");

taskManager.addTask("Done","Doing 1");
taskManager.addTask("Done","Doing 2");
taskManager.addTask("Done","doing 3");

//handle submit event of list addition
addEvent(document.forms.addTaskForm,"submit", function(e){
	e.preventDefault();

	taskManager.addTask(this.column_type.value,this.task_content.value);

	this.reset();
});

//handle submit for task addition
addEvent(document.forms.addListForm,"submit", function(e){
	e.preventDefault();

	taskManager.addList(this.task_list.value);

	this.reset();
});

//handle any click actions on task
addEvent(document.getElementById("task_lists"),"click",function(e){
	var target = e.target || e.srcElement
		,p =target.parentNode
		,actions = p.querySelectorAll("a")
		,input = p.querySelector("input");
	
	//if input is clicked then show the respective actions
	if(target.tagName == "INPUT"){
		actions[0].style.display = "none";

		actions[1].style.display = "inline";
		actions[2].style.display = "inline";
	}

	//if any actions are clicked
	if(target.tagName == "A"){
		e.preventDefault();
		var cls = target.className;

		//save : to save any edits
		//cancel : to discard any edits
		//delete : to remove a task
		if(cls == "cancel" || cls == "save"){
			input.blur();

			if(cls == "save"){
				taskManager.update(input.value, p.getAttribute("data-type"), p.getAttribute("data-index"));
			}else{
				input.value = taskManager.getTask(p.getAttribute("data-type"), p.getAttribute("data-index"))
			}

			actions[1].style.display = "none";
			actions[2].style.display = "none";

			actions[0].style.display = "inline";
		}else if(cls= "delete"){
			if(taskManager.delete(p.getAttribute("data-type"), p.getAttribute("data-index"))){
				p.parentNode.removeChild(p);
			}else{
				alert("Unable to delete");
			}
		}
	}
});

//helper for attaching events
function addEvent(element,type,callback){
	if ( document.addEventListener ) {
		element.addEventListener( type, callback, false );
	} else if ( elem.attachEvent ) {
		element.attachEvent( "on"+type, callback );
	}
}