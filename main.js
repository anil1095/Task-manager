if(typeof String.prototype.trim !== 'function'){String.prototype.trim = function() {return this.replace(/^\s+|\s+$/g, '');};};

var taskManager = (function(){
	var tasks = {}
	,tasksContainerRef = {}
	,taskListContainer = document.getElementById('task_lists')
	,list_selector = document.getElementById("list_selector")
	,actions = null;

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

	function addDraggableEvents(node,type,pos){
		node.setAttribute('draggable', 'true');

		addEvent(node, 'dragstart', function (e) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('type', type);
			e.dataTransfer.setData('pos', pos);
		});
	}

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
		,getTask: function(type,num){
			//console.log(type,num);
			if(!("list-"+type in tasks) || num < 0 || num >= tasks.length)
				return false;

			return tasks["list-"+ type][num].value;
		}
		,delete: function(type,num){
			if(num < 0 || num >= tasks.length)
				return false;

			tasks["list-" + type].splice(num,1);
			return true;
		}
		,update: function(value,type,num){
			if(num < 0 || num >= tasks.length)
				return false;

			tasks["list-" + type][num].value = value;
			return true;
		}
		,getStatus: function(num){
			if(num < 0 || num >= tasks.length)
				return false;

			return tasks[num].status;
		}
		,get: function(){
			return tasks
		}
	};

	return actions;
})();

taskManager.addList("Todo");
taskManager.addList("Doing");
taskManager.addList("Done");

taskManager.addTask("Todo","1");
taskManager.addTask("Todo","2");
taskManager.addTask("Todo","3");

taskManager.addTask("Doing","1");
taskManager.addTask("Doing","2");
taskManager.addTask("Doing","3");

taskManager.addTask("Done","1");
taskManager.addTask("Done","2");
taskManager.addTask("Done","3");

addEvent(document.forms.addTaskForm,"submit", function(e){
	e.preventDefault();

	taskManager.addTask(this.column_type.value,this.task_content.value);

	this.reset();
});

addEvent(document.forms.addListForm,"submit", function(e){
	e.preventDefault();

	taskManager.addList(this.task_list.value);

	this.reset();
});

addEvent(document.getElementById("task_lists"),"click",function(e){
	var target = e.target || e.srcElement
		,p =target.parentNode
		,actions = p.querySelectorAll("a")
		,input = p.querySelector("input");
	
	if(target.tagName == "INPUT"){
		actions[0].style.display = "none";

		actions[1].style.display = "inline";
		actions[2].style.display = "inline";
	}

	if(target.tagName == "A"){
		e.preventDefault();
		var cls = target.className;

		if(cls == "cancel" || cls == "save"){
			input.blur();

			if(cls == "save"){
				taskManager.update(input.value, p.getAttribute("data-type"), p.getAttribute("data-index"));
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

function addEvent(element,type,callback){
	if ( document.addEventListener ) {
		element.addEventListener( type, callback, false );
	} else if ( elem.attachEvent ) {
		element.attachEvent( "on"+type, callback );
	}
}