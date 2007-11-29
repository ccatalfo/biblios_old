GearsORMShift = {
	init: function(schema_model, auto_migrate) {
		this.schema_model = schema_model;
		if( auto_migrate ) {
			latest_version = this.latestVersion();
			this.migrateTo(latest_version);
		}
	},

	latestVersion: function() {
		var my_max_version = 0;
		for( var i = 0; i < this.rules.length; i++ ) {
			if( this.rules[i].version > my_max_version ) {
				my_max_version = this.rules[i].version;
			}
		}
		return my_max_version;
	},

	whatIsMyVersion: function() {
		return this.schema_model.select().getOne().version;
	},

	migrateTo: function(target) {
		var currentVersion = this.whatIsMyVersion();
		if( currentVersion == target ) {
			return true;
		}
		else if( currentVersion > target ) {
			for( i = currentVersion; i >= target; i--) {
				console.info('Migrating to rule ' + i );
				console.info(this.rules[i].comment);
				if( this.rules[i].down() ) {
					this.setMyVersion( rules[i].version );
				}
				else {
					console.info('Migrate down to version ' + i + ' failed');
					return false;
				}
			}
		}
		else if( currentVersion < version ) {
			for( i = currentVersion; i <= target; i++) {
				console.info('Migrating to rule ' + i );
				console.info(this.rules[i].comment);
				if( this.rules[i].up() ) {
					this.setMyVersion( rules[i].version );
				}
				else {
					console.info('Migrate up to version ' + i + ' failed');
					return false;
				}
			}
		}
	},

	setMyVersion: function(target) {
		var schema = this.schema.select().getOne();
		schema.version = target;
		schema.save();
	},

	rules: [
		{
			name: 'default rule',
			comment: 'default version 0',
			up: function() {
				return true;
			},
			down: function() {
				return true;
			}
		}
	]
}
