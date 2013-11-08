[JGrid]() - jQuery based Grid library
==================================================

(Requires jQuery and Mustache)

JGrid uses a *Model*-*Store*-*Grid* approach for data-binding.

Usage
=====

Create a new **model** instance.`

	var model = new Model([{
		"name":"location"
	},{
		"name":"age"
	}
	]);

Create a **store** instance and bind the model to this store.

	var store = new Store(model,{
			"proxy":{
				"url":{endpoint url of REST service},
				"type":"AJAX",
				"root":{entrypoint to search for data,defaults to data},
				"record":{the entry point to search for records/rows}
			}
		});


Create a **grid** instance and bind the store. Also pass in the columns config and target (required)
	
	var grid = new Grid(store,{
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
	
	[recordInstance].get([fieldName]);

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

_*Additional info to be updated.*_