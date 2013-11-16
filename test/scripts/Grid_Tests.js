module("Grid");
asyncTest("Grid tests", 2,function() {
	var Model = JGrid.Model,
		Store = JGrid.Store;
		Grid = JGrid.Grid;


	var model = new Model([{
		'name': 'name',
		'type': 'string'
	}, {
		'name': 'age',
		'type': 'number'
	}, {
		'name': 'location'
	}]);
	var _store = new Store(model, {
		'proxy': {
			'url': 'data/Data.json',
			'type': 'ajax',
			'root': 'data',
			'record': 'rows'
		}
	});

	var grid = new Grid(_store, {
		'columns': [{
			'header': 'Name',
			'dataIndex': 'name',

		}, {
			'header': 'Age',
			'dataIndex': 'age',

		}, {
			'header': 'Location',
			'dataIndex': 'location',

		}],
		'target':'grid-one'
	});
	grid.on('beforerender',function(g){
		ok(!g.gridEl,'Grid before - render');
		start();

		
	});
	grid.on('afterrender',function(g){
		ok(g.gridEl,'Grid rendered.')
	});

});