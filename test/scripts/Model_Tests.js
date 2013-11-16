module("Model");
test("new Model() returns a valid value.", function() {
	var Model = JGrid.Model;
	var model_one = new Model([{
		'name':'FieldOne'
	}]);
	ok(model_one.length === 1, "Model of size 1");
	ok(model_one instanceof Model, "model is an instance of Model");

	var model_two = new Model([{
		'name':'A',
		'type':'int'
	},{
		'name':'B'
	}
	]);

	ok(model_two.length === 2, "Model of size 2");
	ok(model_two.modelId !== model_one.modelId, "Models are unique");
});
