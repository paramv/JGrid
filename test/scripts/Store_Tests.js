module("Store");
asyncTest("new Store() returns a valid value.", 4, function() {
	var Model = JGrid.Model,
		Store = JGrid.Store;
	var model = new Model([{
		'name': 'name',
		'type': 'string'
	}, {
		'name': 'age',
		'type': 'number'
	}, {
		'name': 'location'
	}]);
	var data = {
		'data': {
			'rows': [{
				'name': 'A',
				'age': 20,
				'location': 'India'
			}, {
				'name': 'B',
				'age': 21,
				'location': 'Australia'
			}, {
				'name': 'C',
				'age': 30,
				'location': 'England'
			}, {
				'name': 'D',
				'age': 15,
				'location': 'West Indies'
			}, {
				'name': 'E',
				'age': 53,
				'location': 'South Africa'
			}, {
				'name': 'F',
				'age': 20,
				'location': 'New Zealand'
			}, {
				'name': 'G',
				'age': 20,
				'location': 'Sri Lanka'
			}, {
				'name': 'H',
				'age': 20,
				'location': 'Pakistan'
			}, {
				'name': 'I',
				'age': 20,
				'location': 'Bangladesh'
			}]
		}
	};
	var _memStore = new Store(model, {
		'proxy': {
			'type': 'memory',
			'data': data,
			'root': 'data',
			'record': 'rows'
		}
	});
	console.log(_memStore);
	//_memStore.load();
	var _store = new Store(model, {
		'proxy': {
			'url': 'data/Data.json',
			'type': 'ajax',
			'root': 'data',
			'record': 'rows'
		},
		'load': function(store) {
			ok(store instanceof Store, 'store is an instance of Store.');
			ok(store.count > 0, 'store is loaded with ' + store.count + ' records');
			deepEqual(store.model, model, 'Store is associated with its own model.');
			ok(_memStore.count > 0, 'Memory store is loaded with ' + _memStore.count + ' records');
			start();
		}
	});
	_store.load();


});