if(typeof String.prototype.trim !== 'function'){String.prototype.trim = function() {return this.replace(/^\s+|\s+$/g, '');};};

var taskManager = (function(){
	var tasks = {}
	,tasksContainerRef = {}
	,taskListContainer = document.getElementById('task_lists')
	,list_selector = document.getElementById("list_selector");

	function paintTask(type,value,pos){
		var task_wrapper = document.createElement("div")
			,html = '<input type="text" value="'+value+'" class="task-editable"/>'
			+'<a href="#" class="delete">Delete</a><a href="#" class="save">Save</a><a href="#" class="cancel">Cancel</a>';

		task_wrapper.setAttribute("data-index",pos);
		task_wrapper.setAttribute("data-type",type);
		
		task_wrapper.innerHTML = html;
		task_wrapper.className = "task";

		tasksContainerRef["list-"+type].insertBefore(task_wrapper, tasksContainerRef["list-"+type].firstChild);
	}

	return {
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

				opt.innerHTML = type;
				opt.setAttribute("value",type);

				list_selector.appendChild(opt);
			}
		}
		,addTask: function(type,value){
			if(!(type in tasks))
				this.addList(type);

			var len = tasks["list-"+type].length;

			tasks["list-"+type].push({
				value : value
				,status : "pending"
			});

			paintTask(type,value, len)

			return len;
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
		,get: function(){return tasks}
	};
})();

taskManager.addList("Todo");
taskManager.addList("doing");
taskManager.addList("done");

taskManager.addTask("Todo","1");
taskManager.addTask("Todo","2");
taskManager.addTask("Todo","3");

taskManager.addTask("doing","1");
taskManager.addTask("doing","2");
taskManager.addTask("doing","3");

taskManager.addTask("done","1");
taskManager.addTask("done","2");
taskManager.addTask("done","3");

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
	var p =e.target.parentNode
		,actions = p.querySelectorAll("a")
		,input = p.querySelector("input");
	
	if(e.target.tagName == "INPUT"){
		actions[0].style.display = "none";

		actions[1].style.display = "inline";
		actions[2].style.display = "inline";
	}

	if(e.target.tagName == "A"){
		e.preventDefault();
		var cls = e.target.className;

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