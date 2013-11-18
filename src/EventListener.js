(function($) {
	/**
	 * EventListener static class 
	 */
	var EventListener,
		Utils,
		Class;
	Utils = JGrid.Utils;
	Class = Utils.Class;

	EventListener = Class.extend({
		/**
		 * Additional method to add event listeners
		 * @public
		 * @param  {string}   event - Name of the event
		 * @param  {Function} fn    - Callback function
		 * @param  {Object}   scope - Optional scope to be used for the callback
		 */
		on: function(event, fn, scope) {
			if (!event) {
				throw new Error('Event name is required.');
			}
			if (this.eventMap[event] === undefined || this.eventMap[event] === null) {
				this.eventMap[event] = [];
			}
			this.eventMap[event].push({
				isPrivate: false,
				fn: fn,
				scope: scope
			});

		},
		/**
		 * Additional method to remove event listeners
		 * @public
		 * @param  {string}   event - Name of the event
		 * @param  {Function | string} fn    - Callback function
		 */
		off: function(event, fn) {
			var eMap = this.eventMap[event],
				targetIndex,
				fnName;
			if (!eMap) {
				return;
			}
			if (typeof fn === 'function') {
				fnName = fn.name;
			} else {
				fnName = fn;
			}


			$.each(eMap, function(i, val) {
				if (fnName === val.fn.name) {
					targetIndex = i;
					return false;
				}
			});
			eMap.splice(targetIndex, 1);
		},
		/**
		 * Triggers a custom event on the Object passed
		 * @param  {string} event     - Name of the event
		 * @param  {array} eventArgs - Arguments to be passed to the event
		 */
		trigger: function(event, eventArgs) {
			var eMap = this.eventMap[event],
				scope,
				retVal;
			if (!eMap) {
				return;
			}
			$.each(eMap, function(i, val) {
				scope = val.scope || eventArgs[0];
				retVal = val.fn.apply(scope, eventArgs);
			});
			return (retVal === false) ? retVal : true;
		}
	});
	JGrid.EventListener = EventListener;

}(jQuery));