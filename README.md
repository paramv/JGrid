[JGrid]() - jQuery based Grid library
==================================================

(Requires jQuery and Mustache)

JGrid uses a *Model*-*Store*-*Grid* approach for data-binding.

Usage
=====

Create a new **model** instance.`

	var model = new JGrid.Model([{
		"name":"location"
	},{
		"name":"age"
	}
	]);

Create a **store** instance and bind the model to this store.

	var store = new JGrid.Store(model,{
			"proxy":{
				"url":{endpoint url of REST service},
				"type":"AJAX",
				"root":{entrypoint to search for data,defaults to data},
				"record":{the entry point to search for records/rows}
			}
		});


Create a **grid** instance and bind the store. Also pass in the columns config and target (required)
	
	var grid = new JGrid.Grid({
			"store":store,
			"columns":[{
				"header":"Location Name",
				"dataIndex":"location"
			},{
				"header":"Age",
				"dataIndex":"age"
			}],
			"target":"grid-container",
		});

**Sample Data**

	{
		"data": {
			"rows": [{
				"age": 20,
				"location": "India"
			}, {
				"age": 21,
				"location": "Australia"
			}, {
				"age": 30,
				"location": "England"
			}, {
				"age": 15,
				"location": "USA"
			}, {
				"age": 53,
				"location": "South Africa"
			}, {
				"age": 20,
				"location": "New Zealand"
			}]
		}
	}


#API

## Model

>>**Configuration** Configuration options for each Model instance
	
	new Model(field,mappings)

*field* - An array of field configurations.
	
	{
		"name":{@required,the name of the field},
		"type":{the datatype of the field - number/float/currency/string}
		"convert":{optional function that will be called before storing the raw value of the field}
	}

*field* -> *convert* - The raw value of the field is passed in. Should return a valid value. 
			Useful for data-formatting.
	
	"convert":function(value){
		return value.toUpperCase();
	}

*mappings* - Used for specifying has-many associations for each record. More on this later.

<br/>

>>**Methods** Methods available on a Model instance

*get* - A Model in turn creates a Record object. The 'get' method returns the value of the field passed in.
	
	recordInstance.get(fieldName);

<br/>

>>**Events** There are no events associated with a Model instance.

## Store
>>**Configuration** Configuration options for creating a Store

	new Store(model,options)

*model* - A model instance <br/>
*options* -  Additional options for configuring a store<br/>
*options* -> *proxy* - The proxy object is responsible for creating a connection between the store and the REST endpoint.
	
	{
		"proxy":{
			"url":{end point URL},
			"type":{AJAX/memory},
			"root":{Optional root config},
			"record":{Optional record config},
			"data":{data object. Required when using a memory proxy}
		}
	}
<br/>
>>**Properties** Properties of a store instance

*count (int)* - The number of records present in a store.
*isStoreLoading (boolean)* - Indicates if the store is currently loading.
*isStoreLoaded (boolean)* - Indicates that the store has finished loading.
*data (array)* - An array of records, present in the store.
*rawData (object)* - The raw data received from the server. 
<br/>


>>**Methods** Methods available on a store instance

*add* - Used to add a row to the store. Only one row can be added at a time. The recordObject should be a normal JavaScript object with field names and values

	storeInstance.add(Object recordObj);

*addAll* - Used to add multiple records to a store. Records is an array of JavaScript objects

	storeInstance.add(Array records);	

*each* - Used to iterate through the records in a store.

	storeInstance.add(Function function(int idx,Record record){...});		

*find* - Used to find a record within a store. Returns null if no match is found.
	
	storeInstance.find(string fieldName,string value,[boolean isCaseSensitive,boolean anyMatch]);	

*findById* - Used to find a record within a store using the record id. Returns null if no match is found.

	storeInstance.find(string id);

*getAt* - Returns the object at a given index. Returns null if no match is found.

	storeInstance.getAt(int idx);

*insertAt* - Used to add a row to the store at a given index. Only one row can be added at a time.

	storeInstance.insertAt(int idx, Object recordObj);

*load* -  Used to load/reload the store by making a new request to the server, optionally providing a new url and params
	
	storeInstance.load([string url, Object params]);

*on* - Add an event listener on the store instance. See the events section for more information.

	storeInstance.on(string eventName, Function callback, [Object scope]);

*off* - Remove an event listener on the store instance. See the events section for more information.

	storeInstance.on(string eventName, [Function callback]);

*remove* - Used to remove a row to the store at a given index. The first record for which the callback returns true is removed.

	storeInstance.remove(Function function(record){});

*removeAt* - Used to remove a row from the store at a given index. Only one row can be removed at a time.

	storeInstance.removeAt(int idx);

*removeAll* - Used to remove all rows from the store.

	storeInstance.removeAll();

*sort* - Used to sort the store
	
	storeInstance.sort(string fieldName, string direction);

>>**Events** Events available on a store instance

*load* - The load event is triggered once an AJAX request to the server succeeds.

	function(Store storeInstance, Array records);

## Grid
>>**Configuration** Configuration options for creating a Grid

	new Grid(options);
<br/>
*options* -  Additional options for configuring a store<br/>
*options* -> *store* - A store instance or a store configuration object.<br/>
*options* -> *columns* - An array of column configurations.<br/>
	
	'columns': [{
			'header': '{column name}',
			'dataIndex': '{key name that links the column to a field in the store/model}',
			'renderer':{function(val){..} - An optional function that will be called before rendering the column as markup.}
		}, {
			...
		}]
*options* -> *templates* - Optional configuration object specifying the Mustache templates to be used. Can be used to customise the tables.<br/>
*options* -> *target* - The id or the DOM node, in which the grid is to be rendered.<br/>
*options* -> *className* - Optional classes to be added on to the grid. Allows adding custom styles.<br/>
*options* -> *id* - Optional id to be added on to the grid.<br/>
<br/>
>>**Properties** Properties of a grid instance

*el* - The element in which the grid is rendered.<br/>
*gridEl* - The table element behind the grid.<br/>
<br/>
>>**Methods** Methods available on a store instance

*load* - Used to update the grid by calling the underlying store's load method.

	grid.load([string url,Object params]);

*destroy* - Used to destroy the grid

	grid.destroy();

*sort* - Used to sort the grid.

	grid.sort(string fieldName, string direction);

*filter* - Used to filter the grid based on the field and value

	grid.filter(string fieldName, string fieldValue);

*on* - Add an event listener on the grid instance. See the events section for more information.

	grid.on(string eventName, Function callback, [Object scope]);

*off* - Remove an event listener on the grid instance. See the events section for more information.

	grid.on(string eventName, [Function callback]);

>>**Events** Events available on a store instance

*beforerender* - This event is fired when the grid's markup is generated, but before it is rendered. Return false from to prevent the grid from rendering.
	
	function(Grid grid, DOMNode el, DocumentFragment table, DocumentFragment tableBody);

*afterrender* - This event is fired after the grid is rendered.

	function(Grid grid, DOMNode el, DOMNode table);

*rowclick* - This event is fired when the a row is clicked.

	function(Grid grid, Record record, DOMNode tdElement, DOMNode trElement);