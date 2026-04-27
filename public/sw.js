// imports
importScripts('https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js')

importScripts('js/sw-db.js');
importScripts('js/sw-utils.js');


const STATIC_CACHE    = 'static-v2';
const DYNAMIC_CACHE   = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';


const APP_SHELL = [
    '/',
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js',
    'js/sw-utils.js',
    'js/libs/plugins/mdtoast.min.js',
    'js/libs/plugins/mdtoast.min.css'
];

const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    //'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js'
];



self.addEventListener('install', e => {


    const cacheStatic = caches.open( STATIC_CACHE ).then(cache => 
        cache.addAll( APP_SHELL ));

    const cacheInmutable = caches.open( INMUTABLE_CACHE ).then(cache => 
        cache.addAll( APP_SHELL_INMUTABLE ));



    e.waitUntil( Promise.all([ cacheStatic, cacheInmutable ])  );

});


self.addEventListener('activate', e => {

    const respuesta = caches.keys().then( keys => {

        keys.forEach( key => {

            if (  key !== STATIC_CACHE && key.includes('static') ) {
                return caches.delete(key);
            }

            if (  key !== DYNAMIC_CACHE && key.includes('dynamic') ) {
                return caches.delete(key);
            }

        });

    });

    e.waitUntil( respuesta );

});





self.addEventListener( 'fetch', e => {

    let respuesta;

    if ( e.request.url.includes('/api') ) {

        // return respuesta????
        respuesta = manejoApiMensajes( DYNAMIC_CACHE, e.request );

    } else {

        respuesta = caches.match( e.request ).then( res => {

            if ( res ) {
                
                actualizaCacheStatico( STATIC_CACHE, e.request, APP_SHELL_INMUTABLE );
                return res;
                
            } else {
    
                return fetch( e.request ).then( newRes => {
    
                    return actualizaCacheDinamico( DYNAMIC_CACHE, e.request, newRes );
    
                });
    
            }
    
        });

    }

    e.respondWith( respuesta );

});


// tareas asíncronas
self.addEventListener('sync', e => {

    console.log('SW: Sync');

    if ( e.tag === 'nuevo-post' ) {

        // postear a BD cuando hay conexión
        const respuesta = postearMensajes();
        
        e.waitUntil( respuesta );
    }

});

// Escuchar PUSH
self.addEventListener('push', e => {

    let data = {};

    if (e.data) {
        try {
            data = JSON.parse(e.data.text());
        } catch (error) {
            data = { titulo: 'Notificación', cuerpo: e.data.text() };
        }
    }

    const title = data.titulo || 'Notificación Push';
    const options = {
        body: data.cuerpo || 'Tienes una nueva notificación',
        icon: data.icon || `img/avatars/${ data.usuario || 'spiderman' }.jpg`,
        badge: data.badge || 'img/favicon.ico',
        image: data.image,
        tag: data.tag || 'chat-push',
        renotify: !!data.renotify,
        requireInteraction: !!data.requireInteraction,
        silent: !!data.silent,
        vibrate: Array.isArray(data.vibrate) ? data.vibrate : [200, 80, 200],
        timestamp: data.timestamp || Date.now(),
        lang: data.lang || 'es-CO',
        dir: data.dir || 'auto',
        data: {
            url: (data.data && data.data.url) || '/',
            id: data.usuario || 'spiderman',
            user: data.data && data.data.user
        },
        actions: Array.isArray(data.actions) ? data.actions : [
            {
                action: 'open-chat',
                title: 'Abrir chat',
                icon: 'img/avatars/spiderman.jpg'
            },
            {
                action: 'close-notification',
                title: 'Cerrar',
                icon: 'img/avatars/ironman.jpg'
            }
        ]
    };

    if (options.silent) {
        delete options.vibrate;
    }


    e.waitUntil( self.registration.showNotification( title, options) );


});


// Cierra la notificacion
self.addEventListener('notificationclose', e => {
    console.log('Notificación cerrada', e);
});


/* self.addEventListener('notificationclick', e => {


    const notificacion = e.notification;
    const accion = e.action;


    console.log({ notificacion, accion });
    // console.log(notificacion);
    // console.log(accion);
    

    const respuesta = clients.matchAll()
    .then( clientes => {

        let cliente = clientes.find( c => {
            return c.visibilityState === 'visible';
        });

        if ( cliente !== undefined ) {
            cliente.navigate( notificacion.data.url );
            cliente.focus();
        } else {
            clients.openWindow( notificacion.data.url );
        }

        return notificacion.close();

    });

    e.waitUntil( respuesta );


}); */

self.addEventListener('notificationclick', e => {
    const notificacion = e.notification;
    const url = notificacion.data && notificacion.data.url ? notificacion.data.url : '/';
    const accion = e.action;

    e.notification.close();

    if (accion === 'close-notification') {
        return;
    }

    const respuesta = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(clientes => {

        for (const cliente of clientes) {
            if ('focus' in cliente) {
                if (cliente.url.includes(url) || cliente.visibilityState === 'visible') {
                    return cliente.focus();
                }
            }
        }

        if (clients.openWindow) {
            return clients.openWindow(url);
        }
    });

    e.waitUntil(respuesta);
});