module("Store");
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
asyncTest("new Store() returns a valid value.", 14, function() {
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
	var _memStore = new Store(model, {
		'proxy': {
			'type': 'memory',
			'data': data,
			'root': 'data',
			'record': 'rows'
		},
		'filter':{

		}
	});
	var _store = new Store(model, {
		'proxy': {
			'url': 'data/Data.json',
			'type': 'ajax',
			'root': 'data',
			'record': 'rows'
		},
		'load': function(store) {
			ok(store instanceof Store, 'store is an instance of Store.');
			ok(store.count === store.data.length, 'store.count shows the correct value.');
			ok(store.count > 0, 'store is loaded with ' + store.count + ' records');
			deepEqual(store.model, model, 'Store is associated with its own model.');
			ok(_memStore.count > 0, 'Memory store is loaded with ' + _memStore.count + ' records');
			var tmp = {
				'name': 'TestRecord',
				'age': 20,
				'location': 'India'
			};
			store.add(tmp);
			deepEqual(store.getAt(store.count - 1).data, tmp, 'Add record passed.');

			var count = store.count;
			store.addAll([{
				'name': 'TestRecord3',
				'age': 20,
				'location': 'India'
			}, {
				'name': 'TestRecord4',
				'age': 20,
				'location': 'India'
			}]);
			ok(store.count === count + 2, 'Add multiple records passed');

			var recs = store.find('location','India',true,false);
			ok(recs[0].get('location') === 'India','Find record(s) passed - case sensitive,exact match.')

			recs = store.find('location',' Ind',true,true);
			ok(recs.get('location') === 'West Indies','Find record(s) passed - case sensitive,any match.')

			recs = store.find('location','in',false,true);
			ok(recs.length === 5,'Find record(s) passed - case sensitive,any match.')

			recs = store.find('location','West Indies');
			var rec = store.findById(recs.recordId);
			ok(recs.recordId === rec.recordId,'Find record by id ('+rec.recordId+') passed')

			store.remove(function(rec){
				return rec.get('location') === 'West Indies' ? true : false;
			});
			ok(!store.find('location','West Indies'),'Remove record passed');

			count = store.count;
			store.removeAt(0);
			ok(store.count === count-1,'Remove record at index  passed');

			store.removeAll();
			ok(store.count === 0,'Remove all records passed');

			start();
		}
	});
	_store.load();
});