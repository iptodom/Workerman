
if( self.document !== undefined ) {
    
    /* ************************************** */
    /* ************* FRONT END ************** */
    /* ************************************** */
    
    var Workerman = function(worker_file) {
        
        if( ! window.Worker ) {
            console.error("Web Workers are not supported on this browser :/");
        }
        
        this.worker_file        = worker_file;
        this.worker             = null;
        this.listeners          = {};
        this.DEBUG              = true;
        
        var $this = this
        
        this.log = function(w) {
            console.log($this.worker_file + ' ' + w);
            return $this;
        }
        
        this.error = function(w) {
            console.error($this.worker_file + ' ' + w);
            return $this;
        }
        
        this.warn = function(w) {
            console.warn($this.worker_file + ' ' + w);
            return $this;
        }
        
        this.on = function(action, action_callback) {
            $this.listeners[action] = action_callback;
            if( $this.DEBUG && ! action.match(/^__workerman/) ) $this.log('  | Binded listener to "'+action+'"');
            return $this;
        }
        
        this.send = function(action, data) {
            $this.worker.postMessage({action: action, contents: data});
            if( $this.DEBUG && ! action.match(/^__workerman/) ) $this.log('<<< Sent message with action "'+action+'"');
            return $this;
        } 
        
        this.bind = function() {
            
            var engineListeners = $this.listeners;
            
            this.worker.onmessage = function(event) {
                var action_found = false;
                for(var action in engineListeners) {
                    if(event.data.action == action) {
                        engineListeners[action](event.data.contents);
                        action_found = true;
                        break;
                    }
                }
                if( ! action_found ) {
                    $this.warn('|   The action "'+event.data.action+'" is not defined');
                }
            }
            
            return $this;
        }
        
        this.terminate = function() { $this.worker.terminate(); return $this; }
        
        this.start = function() {
            $this.worker = new Worker($this.worker_file);
            
            $this.on('__workerman_log', function(data) { $this.log(data); });
            $this.on('__workerman_error', function(data) { $this.error(data); });
            $this.on('__workerman_warn', function(data) { $this.warn(data); });
            
            $this.send('__workerman_start');
            
            $this.bind();
            
            if( $this.DEBUG ) $this.log('  | Starting ...');
        }
    }
    
    
} else {
    
    /* ************************************** */
    /* ************* BACK END *************** */
    /* ************************************** */
    
    var THIS_WORKER = self;
    
    function log(w)   { self.postMessage({action: '__workerman_log', contents: w}); }
    function error(w) { self.postMessage({action: '__workerman_error', contents: w}); }
    function warn(w) { self.postMessage({action: '__workerman_warn', contents: w}); }

    var Workerman = function() {
        
        this.listeners = {};
        this.DEBUG = true;
        
        var $this = this;
        
        this.on = function(action, action_callback) {
            $this.listeners[action] = action_callback;
            if( $this.DEBUG && ! action.match(/^__workerman/)) log('|   Binded listener to "'+action+'"');
            return $this;
        }
        
        this.send = function(action, data) {
            THIS_WORKER.postMessage({action: action, contents: data});
            if( $this.DEBUG && ! action.match(/^__workerman/)) log('>>> Sent message with action "'+action+'"');
            return $this;
        } 
        
        this.bind = function() {
            var engineListeners = $this.listeners;
            
            THIS_WORKER.onmessage = function(event) {
                var action_found = false;
                for(var action in engineListeners) {
                    if(event.data.action == action) {
                        engineListeners[action](event.data.contents);
                        action_found = true;
                        break;
                    }
                }
                if( ! action_found ) {
                    warn('|   The action "'+event.data.action+'" is not defined');
                }
            }
            
            return $this;
        }
        
        this.start = function() {
            $this.bind();
            if( $this.DEBUG ) log('|   Started.');
            return $this;
        }
        
        this.on('__workerman_start', function(data) {
            /* Unused hook */
        });
    }
}
