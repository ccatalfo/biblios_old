/*
 	Script: GearsORM.js
 	        Contains the main namespace for GearsORM and a thin abstraction for open,close and execute functions
 	
 	License:
 	        MIT-style license.
*/

/*
  Class: GearsORM
  the main namespace for GearsORM,also provide a basic api wrapper for execute,close and open
 */
var GearsORM =
{
	version:"0.3dev",
	_db:null,
	_models:{},
	dbName:"gears.orm",
	debug:true,
	/*
	Function: getDB

   		return a open database connection
   		
   	Returns:

		A open database connection.   
	 */
	getDB:function()
	{
		if(!GearsORM._db)
		{
			try
			{
				GearsORM._db = google.gears.factory.create('beta.database', '1.0');
				GearsORM._db.open(GearsORM.dbName);
			}
			catch(e)
			{
				throw new Error("couldn`t open database: "+GearsORM.dbName +" exception: "+e.message);
			}
		}	
    	return GearsORM._db;
	},
	/*
	Function: execute

   		execute a sql query on the database
   		
   	Parameters:
   		sql - sql query to execute
   		params - bind parameters to be used in the sql query,optional
	 */
	execute:function(sql,params)
	{
		try
		{
			if(GearsORM.debug)GearsORM.log(sql,params);
			return GearsORM.getDB().execute(sql,params || []);
		}
		catch(e)
		{
			throw new Error(e.message);
		}
	},
	/*
	Function: executeAndClose

   		execute a sql query on the database and close it.
   		
   	Parameters:
   		sql - sql query to execute
   		params - bind parameters to be used in the sql query,optional
	 */
	executeAndClose:function(sql,params)
	{
		try
		{
			if(GearsORM.debug)GearsORM.log(sql,params);
			var rs = GearsORM.getDB().execute(sql,params || []);
			rs.close();
			return rs;
		}
		catch(e)
		{
			throw new Error(e.message);
		}
	},
	/*
	Function: close

   		close the database connection.
	 */
	close:function()
	{
		GearsORM.getDb().close();
	},
	/*
	taken from mootools
	 */
	extend:function(src, add)
	{
		if (!add)
		{
			add = src;
			src = this;
		}
		for (var property in add) src[property] = add[property];
		return src;
	}
};
/*if(window.console && window.console.log && GearsORM.debug)
	GearsORM.log = console.log;
else*/
GearsORM.log = function(){};GearsORM.Events = function()
{
this.$events = {};
}
GearsORM.Events.prototype = 
{
	addListener:function(name,fn)
	{
		this.$events[name] = this.$events[name] || [];
		this.$events[name].push(fn);
		return this;	
	},
	removeListener:function(name,fn)
	{
		if(this.$events[name])
			this.$events[name].remove(fn);
		return this;
	},
	fireEvent:function(name,args,bind)
	{
		var listeners = this.$events[name];
		if(listeners)
			for(var i=0,ln=listeners.length;i<ln;i++)
				listeners[i].apply(bind || this,args || [])
		return this;
	}
}
GearsORM.Events.wrapFunction=function(fn,name,object)
{
	return function()
	{
		object.fireEvent("onBefore"+name,[this]);
		var ret = fn.apply(this,arguments);
		object.fireEvent("onAfter"+name,[this]);
		return ret;
	};
};/*
 	Script: GearsORM.ResultIterator.js
 	        Contains the ResultIterator class.
 	
 	License:
 	        MIT-style license.
*/

/*
 Class: GearsORM.ResultIterator
 	a iterator on a Google Gears ResultSet
 	
 Parameters:
 	result - the ResultSet to iterate
 	modelClass - the model class used to map the results 
 */
GearsORM.ResultIterator = function(result,modelClass)
{
	this.result = result;
	this.modelClass = modelClass;
	this.first = true;
};

GearsORM.ResultIterator.prototype = 
{
	//TODO:add a function to retrive results as raw objects
	/*
	 Function: next
	  	return the next row in the ResultSet as a model instance,if it is the last row it will return false.
	 */
	next:function()
	{
		if(!this.first)
			this.result.next();
		else
			this.first = false;
			
		return this.result.isValidRow() ? new this.modelClass()._populateFromResult(this.result) : this.close();
	},
	/*
	 Function: each
	  	a function to iterate the ResultSet like ruby each.
	 
	 Parameters:
	 	fn - function to be called for each row in the ResultSet
	 	bind - this will be used as this for the function,optional
	 */
	each:function(fn,bind)
	{
		var current;
		while(current = this.next())fn.apply(bind || this,[current]);
	},
	/*
	 Function: close
	  	close the ResultSet,this will be done automaticlly if the ResultSet is iterated to the end.
	  	if you don`t finish iterate the ResultSet this need to be called manually.
	 */
	close:function()
	{
		this.result.close();
		return false;
	},
	/*
	 Function: getOne
	  	return the first row of the ResultSet,will return false if the ResultSet is empty.
	 */
	getOne:function()
	{
		var instance = this.next();
		this.close();
		return instance;
	},
	/*
	 Function: getOne
	  	return the ResultSet as Array of model instances
	 */
	toArray:function()
	{
		var arr = [];
		this.each(arr.push,arr);
		return arr;
	}
};GearsORM.Sql =
{
	deleteRowByIdAndTable:function(tableName)
	{
		return ["DELETE FROM ",tableName," WHERE rowid = ?"].join("");
	},
	dropTableByName:function(tableName)
	{
		return "DROP TABLE IF EXISTS " + tableName;
	},
	createTableByModelClass:function(modelClass)
	{
		var options = modelClass.options;
		var fields = options.fields;
		var query = ["CREATE TABLE IF NOT EXISTS  ",options.name,"("];
		for(var fieldName in fields)
		{
			var field = fields[fieldName];
			//ignore ManyToOne and ManyToMany,as they are backward relations
			if(!field.isBackwardRelation)
			{
				if(!field.isRelation)
				{
					query.push(fieldName);
					query.push(" ");
				}
				query.push(field.toSql());
				query.push(",");
			}
		}
		query = query.splice(0,query.length-1);
		query.push(")");
		return query.join("");
	},
	deleteFromTableWhere:function(tableName,whereExpression)
	{
		return ["DELETE FROM ",tableName,whereExpression ? " WHERE " : "",whereExpression].join("");	
	},
	updateByModel:function(modelClass)
	{
		return ["UPDATE ",modelClass.options.name," SET ",GearsORM.Sql._fieldsValue(modelClass)," WHERE rowid = ?"].join("");
	},
	selectCount:function(tableName,whereExpression)
	{
		return ["SELECT COUNT(*) as c FROM ",tableName,whereExpression ? " WHERE " + whereExpression :""].join("");
	},
	selectWithManyToMany:function(modelClass,relatedClass,m2mTableName,whereExpression,rowid)
	{
		var query = ["SELECT DISTINCT ",relatedClass.options.name,".","rowid,"];
		query.push(GearsORM.Sql._selectFields(relatedClass));
		query.push(" FROM ");
		query.push(relatedClass.options.name);
		query.push(GearsORM.Sql._selectJoins(relatedClass));
		query.push(GearsORM.Sql._m2mJoins(modelClass.options.name,relatedClass.options.name,m2mTableName,rowid));
		if(whereExpression)
		{
			query.push(" WHERE ");
			query.push(whereExpression);
		}
		return query.join("");
	},
	selectWithForigenKeys:function(modelClass,whereExpression)
	{
		var query = ["SELECT ",modelClass.options.name,".","rowid,"];
		query.push(GearsORM.Sql._selectFields(modelClass));
		query.push(" FROM ");
		query.push(modelClass.options.name);
		query.push(GearsORM.Sql._selectJoins(modelClass));
		if(whereExpression)
		{
			query.push(" WHERE ");
			query.push(whereExpression);
		}
		return query.join("");
	},
	insertRowByModel:function(modelClass)
	{
		var self = GearsORM.Sql;
		return ["INSERT INTO ",modelClass.options.name," (",
		self._filedsByModel(modelClass),
		") VALUES (",
		self._valuesByModel(modelClass),")"].join("");
	},	
	oneToManySql:function(relatedModelName,allowNull)
	{
		return [relatedModelName,"_id INTEGER",!allowNull ? " NOT NULL " : " " ,"CONSTRAINT fk_",relatedModelName,"_id REFERENCES ",relatedModelName,"(rowid)"].join("");
	},
	createInsertForigenKeyTrigger:function(tableName,relatedTableName,allowNull)
	{
		return GearsORM.Sql._createInsertUpdateForigenKeyTrigger(tableName,relatedTableName,false,allowNull);
	},
	createUpdateForigenKeyTrigger:function(tableName,relatedTableName,allowNull)
	{
		return GearsORM.Sql._createInsertUpdateForigenKeyTrigger(tableName,relatedTableName,true,allowNull);
	},
	createDeleteRestrictTrigger:function(tableName,relatedTableName)
	{
		return GearsORM.Sql._createDeleteCascadeOrRestrictTrigger(tableName,relatedTableName,false);
	},
	createDeleteCascadeTrigger:function(tableName,relatedTableName)
	{
		return GearsORM.Sql._createDeleteCascadeOrRestrictTrigger(tableName,relatedTableName,true);
	},
	dropForigenKeyInsertTrigger:function(tableName,relatedTableName)
	{
		return GearsORM.Sql._dropForigenKeyTrigger(tableName,relatedTableName,"i");
	},
	dropForigenKeyUpdateTrigger:function(tableName,relatedTableName)
	{
		return GearsORM.Sql._dropForigenKeyTrigger(tableName,relatedTableName,"u");
	},
	dropForigenKeyDeleteTrigger:function(tableName,relatedTableName)
	{
		return GearsORM.Sql._dropForigenKeyTrigger(tableName,relatedTableName,"d");
	},
	_createDeleteCascadeOrRestrictTrigger:function(tableName,relatedTableName,cascade)
	{
		
		  var sql = ["CREATE TRIGGER IF NOT EXISTS fkd_",tableName,"_",relatedTableName,"_rowid ",
		  			"BEFORE DELETE ON ",relatedTableName,
		  			" FOR EACH ROW BEGIN"];
		  if(cascade)
		  {
		  	sql.push(" DELETE from ");
			sql.push(tableName);
			sql.push(" WHERE ");
			sql.push(relatedTableName);
			sql.push("_id = OLD.rowid;");		
		  }
		  else
		  {
		  	sql.push(" SELECT RAISE(ROLLBACK, 'delete on table \"");
			sql.push(relatedTableName);
			sql.push("\" violates foreign key constraint \"fk_");
			sql.push(tableName);
			sql.push("_");
			sql.push(relatedTableName);
			sql.push("_id\"')");
			sql.push("WHERE (SELECT ");
			sql.push(relatedTableName);
			sql.push("_id FROM ");
			sql.push(tableName);
			sql.push(" WHERE ");
			sql.push(relatedTableName);
		    sql.push("_id = OLD.rowid) IS NOT NULL;");
		  }
		  sql.push(" END;");
		  return sql.join("");
	},
	_createInsertUpdateForigenKeyTrigger:function(tableName,relatedTableName,update,allowNull)
	{
		var sql =  ["CREATE TRIGGER IF NOT EXISTS fk",update ? "u" : "i","_",tableName,"_",relatedTableName,"_rowid BEFORE "];
		if(update)
			sql.push("UPDATE");
		else
			sql.push("INSERT");
			
		sql.push(" ON ");
		sql.push(tableName);
		sql.push(" FOR EACH ROW BEGIN ");
		sql.push("SELECT RAISE(ROLLBACK, '");
		if(update)
			sql.push("update");
		else
			sql.push("insert");
		sql.push(" on table \"");
		sql.push(tableName);
		sql.push("\" violates foreign key constraint \"fk_");
		sql.push(relatedTableName);
		sql.push("_rowid");
		sql.push("\"') WHERE ");
		if(allowNull)
		{
			sql.push("NEW.");
			sql.push(relatedTableName);
			sql.push("_id IS NOT NULL AND ");
		}
		sql.push("(SELECT rowid FROM ");
		sql.push(relatedTableName);
		sql.push(" WHERE rowid = NEW.");
		sql.push(relatedTableName);
		sql.push("_id) IS NULL; END;");
		return sql.join("");
	},
	_selectFields:function(modelClass)
	{
		var fields = modelClass.options.fields;
		var modelName = modelClass.options.name;
		var sql = [];
		for(var fieldName in fields)
		{
			var field = fields[fieldName];
			if(!field.isBackwardRelation)
			{
				if(field.isRelation)
				{
					var relatedClass = field.getRelatedClass();
					if(relatedClass == modelClass)
					{
						sql.push(modelName);
						sql.push(".");
						sql.push(relatedClass.options.name);
						sql.push("_id");
					}
					else
						sql.push(GearsORM.Sql._selectFields(relatedClass));
				}
				else
				{
					sql.push(modelName);
					sql.push(".");
					sql.push(fieldName);
					sql.push(" AS ");
					sql.push(modelName);
					sql.push("_");
					sql.push(fieldName);
				}
				sql.push(",");
			}
		}
		return sql.splice(0,sql.length-1).join("");
	},
	_selectJoins:function(modelClass)
	{
		var fields = modelClass.options.fields;
		var name = modelClass.options.name;
		var sql = [];
		for(var fieldName in fields)
		{
			var field = fields[fieldName];
			if(field.isRelation && !field.isBackwardRelation && field.getRelatedClass() != modelClass)
			{
				var relatedName = field.getRelatedClass().options.name;
				sql.push(" LEFT JOIN ");
				sql.push(relatedName);
				sql.push(" ON ");
				sql.push(relatedName);
				sql.push(".rowid = ");
				sql.push(name);
				sql.push(".");
				sql.push(relatedName);
				sql.push("_id ");
			}
		}
		return sql.join("");
	},
	_m2mJoins:function(modelName,relatedName,m2mTableName,rowid)
	{
		return [" JOIN ",m2mTableName," ON ",m2mTableName,".",relatedName,"_id = ",relatedName,".rowid AND ",m2mTableName,".",modelName,"_id =",rowid].join("");
	},
	_filedsByModel:function(modelClass)
	{
		var fields = [];
		for(var fieldName in modelClass.options.fields)
		{
			var field = modelClass.options.fields[fieldName];
			if(!field.isBackwardRelation)
			{
				if(!field.isRelation)
					fields.push(fieldName);
				else
				{
					fields.push(field.getRelatedClass().options.name+"_id");
				}	
			}
		}
		return fields.join(",");
	},
	_valuesByModel:function(modelClass)
	{
		var values = [];
		var fields = modelClass.options.fields;
		for(var fieldName in fields)
		{
			if(!fields[fieldName].isBackwardRelation)values.push("?");
		}
		return values.join(",");
	},
	_fieldsValue:function(modelClass)
	{
		var fields = modelClass.options.fields;
		var sql = [];
		for(var fieldName in fields)
		{
			var field = fields[fieldName];
			if(!field.isBackwardRelation)
			{
				if(!field.isRelation)
				{
					sql.push(fieldName+"=?");
				}
				else
				{
					sql.push(field.getRelatedClass().options.name+"_id"+"=?");
				}
			}
		}
		return sql.join(",");
	},
	_dropForigenKeyTrigger:function(tableName,relatedTableName,type)
	{
		return ["DROP TRIGGER IF EXISTS ","fk",type,"_",tableName,"_",relatedTableName,"_rowid"].join("");
	}
};/*
 	Script: GearsORM.Fields.js
 	        Contains the fields to be used in the models.
 	
 	License:
 	        MIT-style license.
*/

GearsORM.Field = {};
/*
 Class: GearsORM.Field.Primitive
 	a meta class for basic field types like varchar,integer,real and timestamp
 	
 Constructor:
 
 Parameters:
 	sqlType - the sql string for the type
 */
GearsORM.Field.Primitive = function(sqlType)
{
	var field = function(options)
	{
		this.options = options || {};
	};
	field.prototype = 
	{
		toSql:function()
		{
			var opts = this.options;
			return  sqlType +
			(opts.maxLength ? "(" + opts.maxLength + ") " : "")+ 
			(opts.primaryKey ? " PRIMARY KEY " : "")+ 
			(opts.autoincrement ? " AUTOINCREMENT " : "")+ 
			(opts.notNull ? " NOT NULL " : "") +
			(opts.defaultValue ? " DEFAULT " + opts.defaultValue+" ": "") +
			(opts.unique ? " UNIQUE " : "");
		},
		isBackwardRelation:false,
		isRelation:false
	};
	field.constructor = GearsORM.Field.Primitive;
	return field;
};
/*
  a object holding all the field types(including relations)
 */
GearsORM.Fields =
{
	String:new GearsORM.Field.Primitive("VARCHAR"),
	Integer:new GearsORM.Field.Primitive("INTEGER"),
	Float:new GearsORM.Field.Primitive("REAL"),
	TimeStamp:new GearsORM.Field.Primitive("TIMESTAMP")
};

/*
 Class: GearsORM.Fields.ManyToOne
 
  represent a ManyToOne relation,this isn`t a actual table field.
  
 Constructor:
 
 Parameters:
 
  options - a object that look like this:
  {
   related:"name_of_the_related_table",
   onDeleteCascade:true/false - if true this will create triggers to emulate a ON DELETE CASCADE,if this is false it will do ON DELETE RESTRICT
  }
 */
GearsORM.Fields.ManyToOne = function(options)
{
	this.options = options;	
};

GearsORM.Fields.ManyToOne.prototype =
{
	/*
	 Function: copy
	  create a copy of this object
	 */
	copy:function()
	{
		return new GearsORM.Fields.ManyToOne(this.options); 
	},
	/*
	 Function: toSql
	  return the sql string for this field
	 */
	toSql:function()
	{
		return "";
	},
	/*
	 Function: select
	  do a SELECT on the related table
	  
	 Parameters:
	 	whereExpression - sql where expression
	 	params - a array of bind parameters to be used in sql query
	 */
	select:function(whereExpression,params)
	{
		return this._selectRemove(whereExpression,params,"select");
	},
	/*
	 Function: remove
	  do a DELETE on the related table
	  
	 Parameters:
	 	whereExpression - sql where expression
	 	params - a array of bind parameters to be used in sql query
	 */
	remove:function(whereExpression,params)
	{
		return this._selectRemove(whereExpression,params,"remove");
	},
	/*
	 Function: getRelatedClass
	  return the related model class
	 */
	getRelatedClass:function()
	{
		return GearsORM._models[this.options.related];
	},
	_selectRemove:function(whereExpression,params,method)
	{
		var fieldName = this.getRelatedClass() == this.modelClass ? this.options.related + "_id": "rowid";
		params = params || [];
		params.unshift(this.instance.rowid);
		return this.getRelatedClass()[method](this.options.related+"."+fieldName+" = ? "+(whereExpression ? " AND " + whereExpression : "") ,params);
	},
	isBackwardRelation:true,
	isRelation:true
};


/*
 Class: GearsORM.Fields.OneToMany
  represent a forigen key relation
  
 Constructor:
 
 Parameters:
 
  options - a object that look like this:
  {
   related:"name_of_the_related_table",
   onDeleteCascade:if true this will create triggers to emulate a ON DELETE CASCADE,if this is false it will do ON DELETE RESTRICT,
   allowNull:allow a null value
  }
 */
GearsORM.Fields.OneToMany = function(options)
{
	this.options = options;
};

GearsORM.Fields.OneToMany.prototype =
{
	/*
	 Function: copy
	  create a copy of this object
	 */
	copy:function()
	{
		return new GearsORM.Fields.OneToMany(this.options); 
	},
	/*
	 Function: toSql
	  return the sql string for this field
	 */
	toSql:function()
	{
		return GearsORM.Sql.oneToManySql(this.options.related,this.options.allowNull);
	},
	/*
	 Function: getRelatedClass
	  return the related model class
	 */
	getRelatedClass:function()
	{
		return GearsORM._models[this.options.related];
	},
	isBackwardRelation:false,
	isRelation:true
};
/*
 Class: GearsORM.Fields.ManyToMany
  represent a many to many relation between two tables using a many to many relation table
  
 Constructor:
 
 Parameters:
 
  options - a object that look like this:
  {
   related:"name_of_the_related_table",
   onDeleteCascade:if true this will create triggers to emulate a ON DELETE CASCADE,if this is false it will do ON DELETE RESTRICT
  }
 */
GearsORM.Fields.ManyToMany = function(options)
{
	this.options = options;
};

GearsORM.Fields.ManyToMany.prototype =
{
	_m2mModel:null,
	/*
	 Function: copy
	  create a copy of this object
	 */
	copy:function()
	{
		return new GearsORM.Fields.ManyToMany(this.options); 
	},
	/*
	 Function: getRelatedClass
	  return the related model class
	 */
	getRelationModel:function()
	{
		if(!this._m2mModel)
		{
			var names = [this.modelClass.options.name,this.options.related].sort();
			var thisModelName = names[0];
			var relatedModelName = names[1];
			
			var fields = {};
			fields[relatedModelName] = new GearsORM.Fields.OneToMany({related:relatedModelName,onDeleteCascade:true});
			fields[thisModelName] = new GearsORM.Fields.OneToMany({related:thisModelName,onDeleteCascade:true});
			
			this._m2mModel = new GearsORM.Model({
				name:"m2m_"+ thisModelName + "_"+ relatedModelName,
				fields:fields
			});
		}
		return this._m2mModel;
	},
	/*
	 Function: add
	 	add a relation between this object to another object
	 
	 Parameters:
	 	realtedObject - a related model instance or a id of that object
	 */
	add:function(realtedObject)
	{
		var m2mTable = this.getRelationModel();
		var relation = new m2mTable();
		relation[this.modelClass.options.name] = this.instance;
		relation[this.getRelatedClass().options.name] = realtedObject;
		relation.save();
		return relation;
	},
	/*
	 Function: toSql
	 	return the sql string for this field
	 */
	toSql:function()
	{
		return "";
	},
	/*
	 Function: createTable
	 	create the many to many table
	 */
	createTable:function()
	{
		//create a new table for the many-to-many relation only if related class is defined
		if(GearsORM._models[this.options.related])
		{
			this.getRelationModel().createTable();
		}
	},
	/*
	 Function: select
	 	do a SELECT on the related table
	 	
	 Parameters:
	 	whereExpression - sql where expression.
	 	params - a array of bind parameters to be used in sql query.
	 */
	select:function(whereExpression,params)
	{
		var m2mTableName = this.getRelationModel().options.name;
		var relatedClass = this.getRelatedClass();
		return new GearsORM.ResultIterator(GearsORM.execute(GearsORM.Sql.selectWithManyToMany(this.modelClass,relatedClass,m2mTableName,whereExpression,this.instance.rowid),params),relatedClass);
	},
	/*
	 Function: remove
	 	delete a relation between this object and other object
	 	
	 Parameters:
	 	realtedObject - a related model instance or a id of that object
	 */
	remove:function(related)
	{
		var relatedName = this.getRelatedClass().options.name; 
		return this.getRelationModel().remove(relatedName + "_id = ?",[typeof(related) == "number" ? related : related.rowid]);
	},
	/*
	 Function: dropTable
	  drop the many to many table
	 */
	dropTable:function()
	{
		this.getRelationModel().dropTable();
	},
	/*
	 Function: getRelatedClass
	  return the related model class
	 */
	getRelatedClass:function()
	{
		return GearsORM._models[this.options.related];
	},
	isBackwardRelation:true,
	isRelation:true
};
/*
 	Script: GearsORM.Model.js
 	        Contains GearsORM.Model a metaclass used to define models
 	
 	License:
 	        MIT-style license.
*/

/*
 Class: GearsORM.Model
 	a metaclass to define models that represent database tables.
  	a metaclass is a class in which the instances are also classes.
  	
 Constructor:
 
 Parameters:
 	
  options - a object used to describe the model look like this:
  { 
  	 name : "Name of the model table",
    fields: 
    {
    	name_of_the_field:a_instance_of_GearsORM.Fields.*
    }
   }
 */
GearsORM.Model = function(options)
{
	if(!options || !options.fields || !options.name)
	{
		throw new Error("model must have fields and name");
	}
	/*
	  Class: GearsORM.Model.model
	  
	  	represent a model instance
	  	
	  Constructor:
	  
	  Parameters:
	  	valuesOrRowID - (optional)a object used to initialize the model instance with values or
	  	it can be the id of the row,in that case it will do a select to retrive the model data.
	 */
	var model = function(valuesOrRowID)
	{
		this.modelClass = model;
		if(valuesOrRowID)
		{
			if(typeof(valuesOrRowID) == "number")
			{
				this.rowid = valuesOrRowID;
				this.refresh();
				return;
			}
			else
			{
				GearsORM.extend(this,valuesOrRowID);
			}
		}
		for(var fieldName in options.fields)
		{
			var field = options.fields[fieldName];
			if(field.isBackwardRelation)
			{
				var copiedField = this[fieldName] = field.copy();
				copiedField.instance = this;
				copiedField.modelClass = model;
			}
		}
			
	};
	model.options = options;
	model.prototype =
	{
		/*
		 Function: remove
		 
		 	remove the instance from the database
		 */
		remove:function()
		{
			if(this.rowid)
				GearsORM.executeAndClose(GearsORM.Sql.deleteRowByIdAndTable(options.name),[this.rowid]);
				
			this.rowid = null;
			return this;
		},
		/*
		 Function: save
		 
		 	save the instance to the database,if the instance is not in the database - it will be created.
		 	if it is already in the database it will be updated.
		 */
		save:function()
		{
			return this._updateInsert(!!this.rowid);
		},
		/*
		 Function: _updateInsert
		 
		 	do the actual insert/update,used by save method.
		 */
		_updateInsert:function(update)
		{
			var query = update ? GearsORM.Sql.updateByModel(model) : GearsORM.Sql.insertRowByModel(model);

			var values = [];
			var fields = model.options.fields;
			for(var fieldName in fields)
			{
				var field = fields[fieldName];
				if(!field.isBackwardRelation)
				{
					var value = this[fieldName];
					if(!field.isRelation)
						values.push(value);
					else
					{
						if(typeof(value) == "number" || (!value && field.options.allowNull))
							values.push(value);
						else if(value.rowid)
							values.push(value.rowid);
						else
							throw new Error("value of related model can be a model instance,or a id(integer)");
					}	
				}
			}
			if(update)values.push(this.rowid);
			GearsORM.executeAndClose(query,values);
			if(!update)this.rowid = GearsORM.getDB().lastInsertRowId;
			return this;
		},
		/*
		 Function: refresh
		 
		 	refresh the model data from database.
		 */
		refresh:function()
		{
			
			if(this.rowid)
			{
				var result =model.select(options.name+".rowid = ?",[this.rowid]).result;
				if(!result.isValidRow())throw new Error("instance doesn`t exist in database");
				this._populateFromResult(result);
				result.close();
			}
			return this;
		},
		/*
		 Function: _populateFromResult
		 
		 	populate the instance from a ResultSet.
		 
		 Parameters:
		 
		 	result - a ResultSet that used to populate the instance.
		 */
		_populateFromResult:function(result)
		{
			var fields = options.fields;
			var name = options.name;
			//every table in google gears have a rowid
			this.rowid = result.fieldByName("rowid");
			for(var fieldName in fields)
			{
				var field = fields[fieldName];
				if(!field.isBackwardRelation)
				{
					if(field.isRelation)
					{
						var relatedClass = field.getRelatedClass();
						if(relatedClass == model)
							this[fieldName] = result.fieldByName(name+"_id");
						else
							this[fieldName] = (new relatedClass())._populateFromResult(result);
					}
					else
					{
						this[fieldName] = result.fieldByName(name+"_"+fieldName);
					}
				}
				else
				{
					var copiedField = this[fieldName] = field.copy();
					copiedField.instance = this;
					copiedField.modelClass = model;
				}
			}
			return this;
		}
	};
	//add reference to the model to the fields
	for(var fieldName in options.fields)
	{
		options.fields[fieldName].modelClass = model;
	}
	GearsORM.extend(model,this);
	GearsORM.extend(model,new GearsORM.Events);
	
	for(var i in model.prototype)//add events to save,remove,refresh
		if(i.charAt(0) != "_")//wrap only public functions
			model.prototype[i] = GearsORM.Events.wrapFunction(model.prototype[i],i.charAt(0).toUpperCase()+i.substring(1),model);

	model.constructor = GearsORM.Model;
	//register the model
	GearsORM._models[options.name] = model;
	return model;
};
/*
  class methods of GearsORM.Model 
  this reffer to the model class
 */
GearsORM.Model.prototype =
{
	/*
	 Function: count
	 
	 	do a COUNT on the model
	 
	 Parameters:
	 	
	 	whereExpression - a SQL expression to be used as the WHERE clause.
	 	params - bind parameters used in the SQL expression.
	 	
	 Returns:
	 
	 	how much objects(rows) match the where expression
	 */
	count:function(whereExpression,params)
	{
		var rs = GearsORM.execute(GearsORM.Sql.selectCount(this.options.name,whereExpression),params);
		var count = rs.fieldByName("c");
		rs.close();
		return count;
	},
	/*
	 Function: select
	 
	 	do a SELECT on the model
	 
	 Parameters:
	 	
	 	whereExpression - a SQL expression to be used as the WHERE clause.
	 	params - bind parameters used in the SQL expression.
	 	
	 Returns:
	 
	 	a new ResultIterator to iterate the ResultSet
	 */
	select:function(whereExpression,params)
	{
		return new GearsORM.ResultIterator(GearsORM.execute(GearsORM.Sql.selectWithForigenKeys(this,whereExpression),params),this);
	},
	/*
	 Function: remove
	 
	 	do a DELETE on the model
	 
	 Parameters:
	 	
	 	whereExpression - a SQL expression to be used as the WHERE clause.
	 	params - bind parameters used in the SQL expression.
	 */
	remove:function(whereExpression,params)
	{
		GearsORM.executeAndClose(GearsORM.Sql.deleteFromTableWhere(this.options.name,whereExpression),params);
	},
	/*
	 Function: createTable
	 
	 	create the table for this model,creating triggers for forigenkeys and creating many-to-many tables if needed.
	 */
	createTable:function()
	{
		GearsORM.Transaction(function(){
			GearsORM.executeAndClose(GearsORM.Sql.createTableByModelClass(this));
			var fields = this.options.fields;
			for(var fieldName in fields)
			{
				var field = fields[fieldName];
				if(field.createTable)
					field.createTable();
			}
			this.createTriggers();
		},this);
	},
	/*
	 Function: dropTable
	 
	 	drop the table and all associate triggers.
	 */
	dropTable:function()
	{
		GearsORM.Transaction(function(){
			GearsORM.executeAndClose(GearsORM.Sql.dropTableByName(this.options.name));
			this.dropTriggers();
		},this);
	},
	/*
	 Function: createTriggers
	 
	 	create triggers to inforce forigenkeys.
	 */
	createTriggers:function()
	{
		//in case of triggers in m2m tables check first that tables exist
		if(this.options.name.indexOf("m2m") == 0)
		{
			//find out which tables are related to this table
			var tableNames = [];
			for(var i in this.options.fields)
			{
				tableNames.push(this.options.fields[i].options.related);
			}
			//if one of the tables doesn`t exist don`t create the triggers
			if(!GearsORM.Introspection.doesTableExist.apply(this,tableNames))
				return;
		};			
		var fields = this.options.fields;
		var name = this.options.name;
		GearsORM.Transaction(function(){
			for(var fieldName in fields)
			{
				var field = fields[fieldName];
				if(field.isRelation && !field.isBackwardRelation)
				{
					//on insert,check that forigen key is valid since sqlite doesn`t enforce forigenkeys
					GearsORM.executeAndClose(GearsORM.Sql.createInsertForigenKeyTrigger(name,field.getRelatedClass().options.name,field.options.allowNull));
					//on update,check that forigen key is valid	since sqlite doesn`t enforce forigenkeys
					GearsORM.executeAndClose(GearsORM.Sql.createUpdateForigenKeyTrigger(name,field.getRelatedClass().options.name,field.options.allowNull));
					
					if(field.options.onDeleteCascade)
						//on delete from parent table,delete all rows that reference the row that is going to be deleted
						GearsORM.executeAndClose(GearsORM.Sql.createDeleteCascadeTrigger(name,field.getRelatedClass().options.name));
					else
						//on delete from parent table,if there is a row that reference the row that is going to be deleted throw a exception
						GearsORM.executeAndClose(GearsORM.Sql.createDeleteRestrictTrigger(name,field.getRelatedClass().options.name));
				}
			}
		});
	},
	/*
	 Function: dropTriggers
	 
	 	drop triggers related to the table.
	 */
	dropTriggers:function()
	{
		var fields = this.options.fields;
		var name = this.options.name;
		GearsORM.Transaction(function(){
			for(var fieldName in fields)
			{
				var field = fields[fieldName];
				if(field.isRelation && !field.isBackwardRelation)
				{
					//INSERT
					GearsORM.executeAndClose(GearsORM.Sql.dropForigenKeyInsertTrigger(name,field.getRelatedClass().options.name));
					//UPDATE
					GearsORM.executeAndClose(GearsORM.Sql.dropForigenKeyUpdateTrigger(name,field.getRelatedClass().options.name));
					//DELETE
					GearsORM.executeAndClose(GearsORM.Sql.dropForigenKeyDeleteTrigger(name,field.getRelatedClass().options.name));
				}
				else if(field._m2mModel)
				{
					field._m2mModel.dropTriggers();
				}
			}
		});
	},
	/*
	 Function: load
	 
	 	load objects from a array to the database.
	 	
	 Parameters:
	 	objects - a array of objects or one object to be saved in the database.
	 	save - if set to true all the objects will be saved to the database.
	 
	 Returns:
	 	return all the objects mapped using the model class.
	 */
	load:function(objects,save)
	{
		var mappedObjects = [],modelClass = this;
        // check if we have an array or not.  if we don't, make a 1-element list of the object.  
		if(!(objects.length==0) && !(objects.length))
			objects = [objects];
		function map()
		{
			for(var objIndex=0,objsLength = objects.length;objIndex<objsLength;objIndex++)
			{
				var obj = new modelClass(objects[objIndex]);
				if(save)obj.save();
				mappedObjects.push(obj);
			}
		}
		if(save)GearsORM.Transaction(map);
		else map();
		return mappedObjects;
	}
};/*
 	Script: GearsORM.Introspection.js
 	        Contains the GearsORM.Introspection utility class,
 	        which contain also a model for sqlite_master table
 	
 	License:
 	        MIT-style license.
 */

/*
  Class: GearsORM.Introspection
  	a utility class to do database introspection.
 */
GearsORM.Introspection =
{
	/*
	 Property: GearsORM.Introspection.sqliteMasterModel
	 	a model to work with sqlite_master(provide information on the schema) table
		sqlite_master definition from sqlite site:
		 CREATE TABLE sqlite_master (
		  type TEXT,
		  name TEXT,
		  tbl_name TEXT,
		  rootpage INTEGER,
		  sql TEXT
		);
	 */
	sqliteMasterModel:new GearsORM.Model({
		name:"sqlite_master",
		fields:
		{
			type:new GearsORM.Fields.String(),
			name:new GearsORM.Fields.String(),
			tbl_name:new GearsORM.Fields.String(),
			rootpage:new GearsORM.Fields.Integer(),
			sql:new GearsORM.Fields.String()
		}
	}),
	/*
	 Function: doesTableExist
	 	get the names of the tables to checked if they exist return true if *all* of them exist
	 	else return false
	 	
	 */
	doesTableExist:function()
	{
		var argsLength = arguments.length;
		var qmarks = [];
		//used instead of ["table"].concat(arguments) since it doesn`t work as expected
		var vals = ["table"];
		for(var i=0;i<argsLength;i++)
		{
			qmarks.push("?");
			vals.push(arguments[i]);	
		}
		var query = ["sqlite_master.type =? AND sqlite_master.name IN (",qmarks.join(","),")"].join("");
		
		return GearsORM.Introspection.sqliteMasterModel
		.count(query,vals) == argsLength;
	}
};/*
 	Script: GearsORM.Transaction.js
 	        Contains a function to run queries in a transaction.
 	
 	License:
 	        MIT-style license.
*/

/*
 Function: GearsORM.Transaction
 	execute a function while running queries in a transaction.
 	adapted from TrimPath Junction db.transact
 	
 Parameters:
 	fn - function to run
 	bind - the object that will be "this" in the function 
 */
GearsORM.Transaction = function(fn,bind)
{
	try
	{
		if(GearsORM.Transaction.depth <= 0)
			GearsORM.execute("BEGIN");
		GearsORM.Transaction.depth++;
		fn.apply(bind || this,[]);
	}
	catch(e)
	{
		GearsORM.Transaction.depth = 0;
		GearsORM.execute("ROLLBACK");
		throw e;
	}
	GearsORM.Transaction.depth = Math.max(0, GearsORM.Transaction.depth - 1);
	if (GearsORM.Transaction.depth <= 0)
		GearsORM.execute("COMMIT");
};
GearsORM.Transaction.depth = 0;
