
var GearsORM={version:"0.3dev",_db:null,_models:{},dbName:"gears.orm",debug:true,getDB:function()
{if(!GearsORM._db)
{try
{GearsORM._db=google.gears.factory.create('beta.database','1.0');GearsORM._db.open(GearsORM.dbName);}
catch(e)
{throw new Error("couldn`t open database: "+GearsORM.dbName+" exception: "+e.message);}}
return GearsORM._db;},execute:function(sql,params)
{try
{if(GearsORM.debug)GearsORM.log(sql,params);return GearsORM.getDB().execute(sql,params||[]);}
catch(e)
{throw new Error(e.message);}},executeAndClose:function(sql,params)
{try
{if(GearsORM.debug)GearsORM.log(sql,params);var rs=GearsORM.getDB().execute(sql,params||[]);rs.close();return rs;}
catch(e)
{throw new Error(e.message);}},close:function()
{GearsORM.getDb().close();},extend:function(src,add)
{if(!add)
{add=src;src=this;}
for(var property in add)src[property]=add[property];return src;}};if(window.console&&window.console.log&&GearsORM.debug)
GearsORM.log=console.log;else
GearsORM.log=function(){};GearsORM.Events=function()
{this.$events={};}
GearsORM.Events.prototype={addListener:function(name,fn)
{this.$events[name]=this.$events[name]||[];this.$events[name].push(fn);return this;},removeListener:function(name,fn)
{if(this.$events[name])
this.$events[name].remove(fn);return this;},fireEvent:function(name,args,bind)
{var listeners=this.$events[name];if(listeners)
for(var i=0,ln=listeners.length;i<ln;i++)
listeners[i].apply(bind||this,args||[])
return this;}}
GearsORM.Events.wrapFunction=function(fn,name,object)
{return function()
{object.fireEvent("onBefore"+name,[this]);var ret=fn.apply(this,arguments);object.fireEvent("onAfter"+name,[this]);return ret;};};GearsORM.ResultIterator=function(result,modelClass)
{this.result=result;this.modelClass=modelClass;this.first=true;};GearsORM.ResultIterator.prototype={next:function()
{if(!this.first)
this.result.next();else
this.first=false;return this.result.isValidRow()?new this.modelClass()._populateFromResult(this.result):this.close();},each:function(fn,bind)
{var current;while(current=this.next())fn.apply(bind||this,[current]);},close:function()
{this.result.close();return false;},getOne:function()
{var instance=this.next();this.close();return instance;},toArray:function()
{var arr=[];this.each(arr.push,arr);return arr;}};GearsORM.Sql={deleteRowByIdAndTable:function(tableName)
{return["DELETE FROM ",tableName," WHERE rowid = ?"].join("");},dropTableByName:function(tableName)
{return"DROP TABLE IF EXISTS "+tableName;},createTableByModelClass:function(modelClass)
{var options=modelClass.options;var fields=options.fields;var query=["CREATE TABLE IF NOT EXISTS  ",options.name,"("];for(var fieldName in fields)
{var field=fields[fieldName];if(!field.isBackwardRelation)
{if(!field.isRelation)
{query.push(fieldName);query.push(" ");}
query.push(field.toSql());query.push(",");}}
query=query.splice(0,query.length-1);query.push(")");return query.join("");},deleteFromTableWhere:function(tableName,whereExpression)
{return["DELETE FROM ",tableName,whereExpression?" WHERE ":"",whereExpression].join("");},updateByModel:function(modelClass)
{return["UPDATE ",modelClass.options.name," SET ",GearsORM.Sql._fieldsValue(modelClass)," WHERE rowid = ?"].join("");},selectCount:function(tableName,whereExpression)
{return["SELECT COUNT(*) as c FROM ",tableName,whereExpression?" WHERE "+whereExpression:""].join("");},selectWithManyToMany:function(modelClass,relatedClass,m2mTableName,whereExpression,rowid)
{var query=["SELECT DISTINCT ",relatedClass.options.name,".","rowid,"];query.push(GearsORM.Sql._selectFields(relatedClass));query.push(" FROM ");query.push(relatedClass.options.name);query.push(GearsORM.Sql._selectJoins(relatedClass));query.push(GearsORM.Sql._m2mJoins(modelClass.options.name,relatedClass.options.name,m2mTableName,rowid));if(whereExpression)
{query.push(" WHERE ");query.push(whereExpression);}
return query.join("");},selectWithForigenKeys:function(modelClass,whereExpression)
{var query=["SELECT ",modelClass.options.name,".","rowid,"];query.push(GearsORM.Sql._selectFields(modelClass));query.push(" FROM ");query.push(modelClass.options.name);query.push(GearsORM.Sql._selectJoins(modelClass));if(whereExpression)
{query.push(" WHERE ");query.push(whereExpression);}
return query.join("");},insertRowByModel:function(modelClass)
{var self=GearsORM.Sql;return["INSERT INTO ",modelClass.options.name," (",self._filedsByModel(modelClass),") VALUES (",self._valuesByModel(modelClass),")"].join("");},oneToManySql:function(relatedModelName,allowNull)
{return[relatedModelName,"_id INTEGER",!allowNull?" NOT NULL ":" ","CONSTRAINT fk_",relatedModelName,"_id REFERENCES ",relatedModelName,"(rowid)"].join("");},createInsertForigenKeyTrigger:function(tableName,relatedTableName,allowNull)
{return GearsORM.Sql._createInsertUpdateForigenKeyTrigger(tableName,relatedTableName,false,allowNull);},createUpdateForigenKeyTrigger:function(tableName,relatedTableName,allowNull)
{return GearsORM.Sql._createInsertUpdateForigenKeyTrigger(tableName,relatedTableName,true,allowNull);},createDeleteRestrictTrigger:function(tableName,relatedTableName)
{return GearsORM.Sql._createDeleteCascadeOrRestrictTrigger(tableName,relatedTableName,false);},createDeleteCascadeTrigger:function(tableName,relatedTableName)
{return GearsORM.Sql._createDeleteCascadeOrRestrictTrigger(tableName,relatedTableName,true);},dropForigenKeyInsertTrigger:function(tableName,relatedTableName)
{return GearsORM.Sql._dropForigenKeyTrigger(tableName,relatedTableName,"i");},dropForigenKeyUpdateTrigger:function(tableName,relatedTableName)
{return GearsORM.Sql._dropForigenKeyTrigger(tableName,relatedTableName,"u");},dropForigenKeyDeleteTrigger:function(tableName,relatedTableName)
{return GearsORM.Sql._dropForigenKeyTrigger(tableName,relatedTableName,"d");},_createDeleteCascadeOrRestrictTrigger:function(tableName,relatedTableName,cascade)
{var sql=["CREATE TRIGGER IF NOT EXISTS fkd_",tableName,"_",relatedTableName,"_rowid ","BEFORE DELETE ON ",relatedTableName," FOR EACH ROW BEGIN"];if(cascade)
{sql.push(" DELETE from ");sql.push(tableName);sql.push(" WHERE ");sql.push(relatedTableName);sql.push("_id = OLD.rowid;");}
else
{sql.push(" SELECT RAISE(ROLLBACK, 'delete on table \"");sql.push(relatedTableName);sql.push("\" violates foreign key constraint \"fk_");sql.push(tableName);sql.push("_");sql.push(relatedTableName);sql.push("_id\"')");sql.push("WHERE (SELECT ");sql.push(relatedTableName);sql.push("_id FROM ");sql.push(tableName);sql.push(" WHERE ");sql.push(relatedTableName);sql.push("_id = OLD.rowid) IS NOT NULL;");}
sql.push(" END;");return sql.join("");},_createInsertUpdateForigenKeyTrigger:function(tableName,relatedTableName,update,allowNull)
{var sql=["CREATE TRIGGER IF NOT EXISTS fk",update?"u":"i","_",tableName,"_",relatedTableName,"_rowid BEFORE "];if(update)
sql.push("UPDATE");else
sql.push("INSERT");sql.push(" ON ");sql.push(tableName);sql.push(" FOR EACH ROW BEGIN ");sql.push("SELECT RAISE(ROLLBACK, '");if(update)
sql.push("update");else
sql.push("insert");sql.push(" on table \"");sql.push(tableName);sql.push("\" violates foreign key constraint \"fk_");sql.push(relatedTableName);sql.push("_rowid");sql.push("\"') WHERE ");if(allowNull)
{sql.push("NEW.");sql.push(relatedTableName);sql.push("_id IS NOT NULL AND ");}
sql.push("(SELECT rowid FROM ");sql.push(relatedTableName);sql.push(" WHERE rowid = NEW.");sql.push(relatedTableName);sql.push("_id) IS NULL; END;");return sql.join("");},_selectFields:function(modelClass)
{var fields=modelClass.options.fields;var modelName=modelClass.options.name;var sql=[];for(var fieldName in fields)
{var field=fields[fieldName];if(!field.isBackwardRelation)
{if(field.isRelation)
{var relatedClass=field.getRelatedClass();if(relatedClass==modelClass)
{sql.push(modelName);sql.push(".");sql.push(relatedClass.options.name);sql.push("_id");}
else
sql.push(GearsORM.Sql._selectFields(relatedClass));}
else
{sql.push(modelName);sql.push(".");sql.push(fieldName);sql.push(" AS ");sql.push(modelName);sql.push("_");sql.push(fieldName);}
sql.push(",");}}
return sql.splice(0,sql.length-1).join("");},_selectJoins:function(modelClass)
{var fields=modelClass.options.fields;var name=modelClass.options.name;var sql=[];for(var fieldName in fields)
{var field=fields[fieldName];if(field.isRelation&&!field.isBackwardRelation&&field.getRelatedClass()!=modelClass)
{var relatedName=field.getRelatedClass().options.name;sql.push(" LEFT JOIN ");sql.push(relatedName);sql.push(" ON ");sql.push(relatedName);sql.push(".rowid = ");sql.push(name);sql.push(".");sql.push(relatedName);sql.push("_id ");}}
return sql.join("");},_m2mJoins:function(modelName,relatedName,m2mTableName,rowid)
{return[" JOIN ",m2mTableName," ON ",m2mTableName,".",relatedName,"_id = ",relatedName,".rowid AND ",m2mTableName,".",modelName,"_id =",rowid].join("");},_filedsByModel:function(modelClass)
{var fields=[];for(var fieldName in modelClass.options.fields)
{var field=modelClass.options.fields[fieldName];if(!field.isBackwardRelation)
{if(!field.isRelation)
fields.push(fieldName);else
{fields.push(field.getRelatedClass().options.name+"_id");}}}
return fields.join(",");},_valuesByModel:function(modelClass)
{var values=[];var fields=modelClass.options.fields;for(var fieldName in fields)
{if(!fields[fieldName].isBackwardRelation)values.push("?");}
return values.join(",");},_fieldsValue:function(modelClass)
{var fields=modelClass.options.fields;var sql=[];for(var fieldName in fields)
{var field=fields[fieldName];if(!field.isBackwardRelation)
{if(!field.isRelation)
{sql.push(fieldName+"=?");}
else
{sql.push(field.getRelatedClass().options.name+"_id"+"=?");}}}
return sql.join(",");},_dropForigenKeyTrigger:function(tableName,relatedTableName,type)
{return["DROP TRIGGER IF EXISTS ","fk",type,"_",tableName,"_",relatedTableName,"_rowid"].join("");}};GearsORM.Field={};GearsORM.Field.Primitive=function(sqlType)
{var field=function(options)
{this.options=options||{};};field.prototype={toSql:function()
{var opts=this.options;return sqlType+
(opts.maxLength?"("+opts.maxLength+") ":"")+
(opts.primaryKey?" PRIMARY KEY ":"")+
(opts.autoincrement?" AUTOINCREMENT ":"")+
(opts.notNull?" NOT NULL ":"")+
(opts.defaultValue?" DEFAULT "+opts.defaultValue+" ":"")+
(opts.unique?" UNIQUE ":"");},isBackwardRelation:false,isRelation:false};field.constructor=GearsORM.Field.Primitive;return field;};GearsORM.Fields={String:new GearsORM.Field.Primitive("VARCHAR"),Integer:new GearsORM.Field.Primitive("INTEGER"),Float:new GearsORM.Field.Primitive("REAL"),TimeStamp:new GearsORM.Field.Primitive("TIMESTAMP")};GearsORM.Fields.ManyToOne=function(options)
{this.options=options;};GearsORM.Fields.ManyToOne.prototype={copy:function()
{return new GearsORM.Fields.ManyToOne(this.options);},toSql:function()
{return"";},select:function(whereExpression,params)
{return this._selectRemove(whereExpression,params,"select");},remove:function(whereExpression,params)
{return this._selectRemove(whereExpression,params,"remove");},getRelatedClass:function()
{return GearsORM._models[this.options.related];},_selectRemove:function(whereExpression,params,method)
{var fieldName=this.getRelatedClass()==this.modelClass?this.options.related+"_id":"rowid";params=params||[];params.unshift(this.instance.rowid);return this.getRelatedClass()[method](this.options.related+"."+fieldName+" = ? "+(whereExpression?" AND "+whereExpression:""),params);},isBackwardRelation:true,isRelation:true};GearsORM.Fields.OneToMany=function(options)
{this.options=options;};GearsORM.Fields.OneToMany.prototype={copy:function()
{return new GearsORM.Fields.OneToMany(this.options);},toSql:function()
{return GearsORM.Sql.oneToManySql(this.options.related,this.options.allowNull);},getRelatedClass:function()
{return GearsORM._models[this.options.related];},isBackwardRelation:false,isRelation:true};GearsORM.Fields.ManyToMany=function(options)
{this.options=options;};GearsORM.Fields.ManyToMany.prototype={_m2mModel:null,copy:function()
{return new GearsORM.Fields.ManyToMany(this.options);},getRelationModel:function()
{if(!this._m2mModel)
{var names=[this.modelClass.options.name,this.options.related].sort();var thisModelName=names[0];var relatedModelName=names[1];var fields={};fields[relatedModelName]=new GearsORM.Fields.OneToMany({related:relatedModelName,onDeleteCascade:true});fields[thisModelName]=new GearsORM.Fields.OneToMany({related:thisModelName,onDeleteCascade:true});this._m2mModel=new GearsORM.Model({name:"m2m_"+thisModelName+"_"+relatedModelName,fields:fields});}
return this._m2mModel;},add:function(realtedObject)
{var m2mTable=this.getRelationModel();var relation=new m2mTable();relation[this.modelClass.options.name]=this.instance;relation[this.getRelatedClass().options.name]=realtedObject;relation.save();return relation;},toSql:function()
{return"";},createTable:function()
{if(GearsORM._models[this.options.related])
{this.getRelationModel().createTable();}},select:function(whereExpression,params)
{var m2mTableName=this.getRelationModel().options.name;var relatedClass=this.getRelatedClass();return new GearsORM.ResultIterator(GearsORM.execute(GearsORM.Sql.selectWithManyToMany(this.modelClass,relatedClass,m2mTableName,whereExpression,this.instance.rowid),params),relatedClass);},remove:function(related)
{var relatedName=this.getRelatedClass().options.name;return this.getRelationModel().remove(relatedName+"_id = ?",[typeof(related)=="number"?related:related.rowid]);},dropTable:function()
{this.getRelationModel().dropTable();},getRelatedClass:function()
{return GearsORM._models[this.options.related];},isBackwardRelation:true,isRelation:true};GearsORM.Model=function(options)
{if(!options||!options.fields||!options.name)
{throw new Error("model must have fields and name");}
var model=function(valuesOrRowID)
{this.modelClass=model;if(valuesOrRowID)
{if(typeof(valuesOrRowID)=="number")
{this.rowid=valuesOrRowID;this.refresh();return;}
else
{GearsORM.extend(this,valuesOrRowID);}}
for(var fieldName in options.fields)
{var field=options.fields[fieldName];if(field.isBackwardRelation)
{var copiedField=this[fieldName]=field.copy();copiedField.instance=this;copiedField.modelClass=model;}}};model.options=options;model.prototype={remove:function()
{if(this.rowid)
GearsORM.executeAndClose(GearsORM.Sql.deleteRowByIdAndTable(options.name),[this.rowid]);this.rowid=null;return this;},save:function()
{return this._updateInsert(!!this.rowid);},_updateInsert:function(update)
{var query=update?GearsORM.Sql.updateByModel(model):GearsORM.Sql.insertRowByModel(model);var values=[];var fields=model.options.fields;for(var fieldName in fields)
{var field=fields[fieldName];if(!field.isBackwardRelation)
{var value=this[fieldName];if(!field.isRelation)
values.push(value);else
{if(typeof(value)=="number"||(!value&&field.options.allowNull))
values.push(value);else if(value.rowid)
values.push(value.rowid);else
throw new Error("value of related model can be a model instance,or a id(integer)");}}}
if(update)values.push(this.rowid);GearsORM.executeAndClose(query,values);if(!update)this.rowid=GearsORM.getDB().lastInsertRowId;return this;},refresh:function()
{if(this.rowid)
{var result=model.select(options.name+".rowid = ?",[this.rowid]).result;if(!result.isValidRow())throw new Error("instance doesn`t exist in database");this._populateFromResult(result);result.close();}
return this;},_populateFromResult:function(result)
{var fields=options.fields;var name=options.name;this.rowid=result.fieldByName("rowid");for(var fieldName in fields)
{var field=fields[fieldName];if(!field.isBackwardRelation)
{if(field.isRelation)
{var relatedClass=field.getRelatedClass();if(relatedClass==model)
this[fieldName]=result.fieldByName(name+"_id");else
this[fieldName]=(new relatedClass())._populateFromResult(result);}
else
{this[fieldName]=result.fieldByName(name+"_"+fieldName);}}
else
{var copiedField=this[fieldName]=field.copy();copiedField.instance=this;copiedField.modelClass=model;}}
return this;}};for(var fieldName in options.fields)
{options.fields[fieldName].modelClass=model;}
GearsORM.extend(model,this);GearsORM.extend(model,new GearsORM.Events);for(var i in model.prototype)
if(i.charAt(0)!="_")
model.prototype[i]=GearsORM.Events.wrapFunction(model.prototype[i],i.charAt(0).toUpperCase()+i.substring(1),model);model.constructor=GearsORM.Model;GearsORM._models[options.name]=model;return model;};GearsORM.Model.prototype={count:function(whereExpression,params)
{var rs=GearsORM.execute(GearsORM.Sql.selectCount(this.options.name,whereExpression),params);var count=rs.fieldByName("c");rs.close();return count;},select:function(whereExpression,params)
{return new GearsORM.ResultIterator(GearsORM.execute(GearsORM.Sql.selectWithForigenKeys(this,whereExpression),params),this);},remove:function(whereExpression,params)
{GearsORM.executeAndClose(GearsORM.Sql.deleteFromTableWhere(this.options.name,whereExpression),params);},createTable:function()
{GearsORM.Transaction(function(){GearsORM.executeAndClose(GearsORM.Sql.createTableByModelClass(this));var fields=this.options.fields;for(var fieldName in fields)
{var field=fields[fieldName];if(field.createTable)
field.createTable();}
this.createTriggers();},this);},dropTable:function()
{GearsORM.Transaction(function(){GearsORM.executeAndClose(GearsORM.Sql.dropTableByName(this.options.name));this.dropTriggers();},this);},createTriggers:function()
{if(this.options.name.indexOf("m2m")==0)
{var tableNames=[];for(var i in this.options.fields)
{tableNames.push(this.options.fields[i].options.related);}
if(!GearsORM.Introspection.doesTableExist.apply(this,tableNames))
return;};var fields=this.options.fields;var name=this.options.name;GearsORM.Transaction(function(){for(var fieldName in fields)
{var field=fields[fieldName];if(field.isRelation&&!field.isBackwardRelation)
{GearsORM.executeAndClose(GearsORM.Sql.createInsertForigenKeyTrigger(name,field.getRelatedClass().options.name,field.options.allowNull));GearsORM.executeAndClose(GearsORM.Sql.createUpdateForigenKeyTrigger(name,field.getRelatedClass().options.name,field.options.allowNull));if(field.options.onDeleteCascade)
GearsORM.executeAndClose(GearsORM.Sql.createDeleteCascadeTrigger(name,field.getRelatedClass().options.name));else
GearsORM.executeAndClose(GearsORM.Sql.createDeleteRestrictTrigger(name,field.getRelatedClass().options.name));}}});},dropTriggers:function()
{var fields=this.options.fields;var name=this.options.name;GearsORM.Transaction(function(){for(var fieldName in fields)
{var field=fields[fieldName];if(field.isRelation&&!field.isBackwardRelation)
{GearsORM.executeAndClose(GearsORM.Sql.dropForigenKeyInsertTrigger(name,field.getRelatedClass().options.name));GearsORM.executeAndClose(GearsORM.Sql.dropForigenKeyUpdateTrigger(name,field.getRelatedClass().options.name));GearsORM.executeAndClose(GearsORM.Sql.dropForigenKeyDeleteTrigger(name,field.getRelatedClass().options.name));}
else if(field._m2mModel)
{field._m2mModel.dropTriggers();}}});},load:function(objects,save)
{var mappedObjects=[],modelClass=this;if(!objects.length)
objects=[objects];function map()
{for(var objIndex=0,objsLength=objects.length;objIndex<objsLength;objIndex++)
{var obj=new modelClass(objects[objIndex]);if(save)obj.save();mappedObjects.push(obj);}}
if(save)GearsORM.Transaction(map);else map();return mappedObjects;}};GearsORM.Introspection={sqliteMasterModel:new GearsORM.Model({name:"sqlite_master",fields:{type:new GearsORM.Fields.String(),name:new GearsORM.Fields.String(),tbl_name:new GearsORM.Fields.String(),rootpage:new GearsORM.Fields.Integer(),sql:new GearsORM.Fields.String()}}),doesTableExist:function()
{var argsLength=arguments.length;var qmarks=[];var vals=["table"];for(var i=0;i<argsLength;i++)
{qmarks.push("?");vals.push(arguments[i]);}
var query=["sqlite_master.type =? AND sqlite_master.name IN (",qmarks.join(","),")"].join("");return GearsORM.Introspection.sqliteMasterModel.count(query,vals)==argsLength;}};GearsORM.Transaction=function(fn,bind)
{try
{if(GearsORM.Transaction.depth<=0)
GearsORM.execute("BEGIN");GearsORM.Transaction.depth++;fn.apply(bind||this,[]);}
catch(e)
{GearsORM.Transaction.depth=0;GearsORM.execute("ROLLBACK");throw e;}
GearsORM.Transaction.depth=Math.max(0,GearsORM.Transaction.depth-1);if(GearsORM.Transaction.depth<=0)
GearsORM.execute("COMMIT");};GearsORM.Transaction.depth=0;