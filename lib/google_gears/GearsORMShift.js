debug=0
GearsORMShift = {
	init: function(schema_model, auto_migrate) {
		this.schema_model = schema_model;
		if( auto_migrate ) {
            if( this.whatIsMyVersion() > this.latestVersion() ) {
                this.setMyVersion(0);
                this.migrateTo( this.latestVersion() );

            }
            else {
                latest_version = this.latestVersion();
                this.migrateTo(latest_version);
            }
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
			for( var i = currentVersion; i > target; i--) {
				if(debug){console.info('Running down() for rule ' + i + ' ' + this.rules[i].comment);}
				if( this.rules[i].down() ) {
					this.setMyVersion( this.rules[i-1].version );
				}
				else {
					if(debug){console.info('Migrate down to version ' + i + ' failed');}
					return false;
				}
			}
		}
		else if( currentVersion < target ) {
			// if we're at version 0, run it's up, too
			if( currentVersion == 0 ) {
				this.rules[0].up();
			}
			for( i = (currentVersion+1); i <= target; i++) {
				if(debug){console.info('Migrating to rule ' + i + ' ' + this.rules[i].comment);}
				if( this.rules[i].up() ) {
					this.setMyVersion( this.rules[i].version );
				}
				else {
					if(debug){console.info('Migrate up to version ' + i + ' failed');}
					return false;
				}
			}
		}
	},

	setMyVersion: function(target) {
		var schema = this.schema_model.select().getOne();
		schema.version = target;
		schema.save();
	},

	rules: [
	]
}
