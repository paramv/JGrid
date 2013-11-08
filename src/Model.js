/** Model JS*/
(function($) {
    'use strict';
    /**
     * Defines the model for the grid.
     * @constructor
     * @param {array} fields - An array of field specifications
     * @returns {object} model - Returns the current model instance
     */

    function Model(fields, hasMany) {
        var modelFields = [],
            me = this;

        function init() {
            var i,
                j,
                field,
                fieldInstance,
                ts = new Date().getTime(),
                mapAssign = function(val, i) {
                    fieldInstance[i] = val;
                };

            if (!fields || !(fields instanceof Array)) {
                throw new Error('Fields is undefined or improper. Correct usage : [{name:"FieldOne"},{name:"FieldTwo"}]');
            }
            j = fields.length;
            for (i = 0; i < j; i++) {
                field = fields[i];
                fieldInstance = {};
                $.map(field, mapAssign);
                modelFields.push(fieldInstance);
            }
            me.modelId = '_model' + ts;
            me.fields = modelFields;
            me.length = modelFields.length;

            Record.prototype.Model = me;
            if (hasMany && typeof hasMany === 'boolean') {
                me.hasMany = {};
                me.hasMany.mapping = 'children';
            } else if (hasMany) {
                me.hasMany = hasMany;
                me.hasMany.mapping = hasMany.mapping || 'children';
            }
        }

        init();
    }

    /**
     * Creates a single record instance
     * @constructor
     * @protected
     * @param {array} - The row object
     * @returns {object} - The record object
     */

    function Record(row, fields, hasMany) {
        var k,
            l,
            field,
            tmpFieldObj = this,
            fieldValue,
            fieldName;

        tmpFieldObj.data = {};

        for (k = 0, l = fields.length; k < l; k++) {
            field = fields[k];
            fieldName = field.name;
            fieldValue = row[fieldName];

            if (typeof field.convert === 'function') {
                fieldValue = field.convert(fieldValue);
            }

            if (hasMany) {
                tmpFieldObj.data[hasMany.mapping] = row[hasMany.mapping] || null;
            }

            tmpFieldObj.data[fieldName] = fieldValue;
        }
    }



    /**
     * Retrieves the value of a given field in a record
     * @param {string} field - The field name
     * @returns {mixed} value - The field value
     */
    Record.prototype.get = function(field) {
        return this.data[field] || null;
    };


    /**
     * Transforms the value of the field according to its data-type.
     * @private
     * @param  {mixed} field
     * @return {mixed} The transformed value
     */
    Record.prototype._transform = function(field) {
        var model = this.Model,
            fieldDescriptor;

        fieldDescriptor = $.grep(model.fields, function(value) {
            return value.name === field;
        })[0];
        if(!fieldDescriptor){
            throw new Error('Field is empty or undefined');
        }
        switch (fieldDescriptor.type) {
            case 'number':
                return parseInt(this.get(field), 10);
            case 'float':
                return parseFloat(this.get(field), 10);
            case 'currency':
                return parseInt(this.get(field).replace(/[^\d]/gi, ''), 10);
            default:
                return this.get(field);

        }

    };

    /**
     * This method can be used to create a new record to be inserted into the store.
     * @params {array} row - The new (unprocessed) row to be created
     * @params {array} row - The new row to be inserted after processing, using the model
     */
    Model.prototype.create = function(row) {
        return new Record(row, this.fields, this.hasMany);
    };


    window.Model = Model;
}(jQuery));