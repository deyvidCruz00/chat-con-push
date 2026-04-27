var url = window.location.href;
var swLocation = '/sw.js';

var swReg;
window.enviarNotificacion = enviarNotificacion;

if ( navigator.serviceWorker ) {


    if ( url.includes('localhost') ) {
        swLocation = '/sw.js';
    }


    window.addEventListener('load', function() {

        navigator.serviceWorker.register( swLocation ).then( function(reg){

            swReg = reg;
            swReg.pushManager.getSubscription().then( verificaSuscripcion );

        });

    });

}





// Referencias de jQuery

var titulo      = $('#titulo');
var nuevoBtn    = $('#nuevo-btn');
var salirBtn    = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn     = $('#post-btn');
var avatarSel   = $('#seleccion');
var timeline    = $('#timeline');

var modal       = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns  = $('.seleccion-avatar');
var txtMensaje  = $('#txtMensaje');

var btnActivadas    = $('.btn-noti-activadas');
var btnDesactivadas = $('.btn-noti-desactivadas');
var btnPushDemo     = $('#btn-push-demo');
var pushStatusBadge = $('#push-permission-status');

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;


function normalizarPermiso(permiso) {
    if (permiso === 'granted') return 'Granted';
    if (permiso === 'denied') return 'Denied';
    return 'Default';
}

function actualizarIndicadorPermisos(permisoActual) {
    if (!pushStatusBadge || pushStatusBadge.length === 0) return;

    var permiso = permisoActual || (window.Notification ? Notification.permission : 'default');
    var permisoClase = (permiso === 'granted' || permiso === 'denied') ? permiso : 'default';
    var permisoTexto = normalizarPermiso(permiso);

    pushStatusBadge
        .removeClass('granted denied default')
        .addClass(permisoClase)
        .text(permisoTexto);
}

function monitorearPermisosNotificacion() {
    actualizarIndicadorPermisos();

    if (!('permissions' in navigator) || !navigator.permissions.query) {
        return;
    }

    navigator.permissions.query({ name: 'notifications' })
        .then(function(permisoStatus) {
            permisoStatus.onchange = function() {
                actualizarIndicadorPermisos(permisoStatus.state);
            };
        })
        .catch(function() {
            // Algunos navegadores no exponen notifications en Permissions API.
        });

    window.addEventListener('focus', function() {
        actualizarIndicadorPermisos();
    });
}




// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje) {

    var content =`
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

}



// Globals
function logIn( ingreso ) {

    if ( ingreso ) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');

        titulo.text('Seleccione Personaje');
    
    }

}


// Seleccion de personaje
avatarBtns.on('click', function() {

    usuario = $(this).data('user');

    titulo.text('@' + usuario);

    logIn(true);

});

// Boton de salir
salirBtn.on('click', function() {

    logIn(false);

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {

    modal.removeClass('oculto');
    modal.animate({ 
        marginTop: '-=1000px',
        opacity: 1
    }, 200 );

});


// Boton de cancelar mensaje
cancelarBtn.on('click', function() {
    if ( !modal.hasClass('oculto') ) {
        modal.animate({ 
            marginTop: '+=1000px',
            opacity: 0
         }, 200, function() {
             modal.addClass('oculto');
             txtMensaje.val('');
         });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function() {

    var mensaje = txtMensaje.val();
    if ( mensaje.length === 0 ) {
        cancelarBtn.click();
        return;
    }

    var data = {
        mensaje: mensaje,
        user: usuario
    };


    fetch('api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( data )
    })
    .then( res => res.json() )
    .then( res => console.log( 'app.js', res ))
    .catch( err => console.log( 'app.js error:', err ));



    crearMensajeHTML( mensaje, usuario );

});



// Obtener mensajes del servidor
function getMensajes() {

    fetch('api')
        .then( res => res.json() )
        .then( posts => {

            console.log(posts);
            posts.forEach( post =>
                crearMensajeHTML( post.mensaje, post.user ));


        });


}

getMensajes();



// Detectar cambios de conexión
function isOnline() {

    if ( navigator.onLine ) {
        // tenemos conexión
        // console.log('online');
        $.mdtoast('Online', {
            interaction: true,
            interactionTimeout: 1000,
            actionText: 'OK!'
        });


    } else{
        // No tenemos conexión
        $.mdtoast('Offline', {
            interaction: true,
            actionText: 'OK',
            type: 'warning'
        });
    }

}

window.addEventListener('online', isOnline );
window.addEventListener('offline', isOnline );

isOnline();


// Notificaciones
function verificaSuscripcion( activadas ) {

    actualizarIndicadorPermisos();

    if ( activadas ) {
        
        btnActivadas.removeClass('oculto');
        btnDesactivadas.addClass('oculto');

    } else {
        btnActivadas.addClass('oculto');
        btnDesactivadas.removeClass('oculto');
    }

}



async function enviarNotificacion() {

    if (!swReg) {
        console.log('No hay registro de Service Worker');
        return;
    }
     if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.log('No hay permiso para mostrar notificaciones');
        return;
    }
    try {
        console.log('Mostrando notificación de prueba...');
        await swReg.showNotification('Notificación de prueba', {
            body: 'Las notificaciones funcionan correctamente en Chrome',
            icon: 'img/icons/icon-192x192.png',
            badge: 'img/favicon.ico',
            data: {
                url: '/index.html'
            },
            requireInteraction: true
        });
    } catch (err) {
        console.log('Error mostrando notificación de prueba:', err);
    }

}

async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('El permiso para las notificaciones se ha concedido!');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('El usuario bloqueó las notificaciones');
    return false;
  }

  const permiso = await Notification.requestPermission();
    actualizarIndicadorPermisos(permiso);
  return permiso === 'granted';
}



// Get Key
function getPublicKey() {

    // fetch('api/key')
    //     .then( res => res.text())
    //     .then( console.log );

    return fetch('api/key')
        .then( res => res.json())
        .then( data => urlBase64ToUint8Array(data.publicKey) );


}

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

// getPublicKey().then( console.log );
/* btnDesactivadas.on( 'click', function() {

    if ( !swReg ) return console.log('No hay registro de SW');

    getPublicKey().then( function( key ) {

        swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        })
        .then( res => res.toJSON() )
        .then( suscripcion => {

            // console.log(suscripcion);
            fetch('api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( suscripcion )
            })
            .then( verificaSuscripcion )
            .catch( cancelarSuscripcion );


        });


    });


});
 */

btnDesactivadas.on('click', async function() {

    try {
        if (!swReg) {
            console.log('No hay registro de SW');
            return;
        }

        const permitido = await solicitarPermisoNotificaciones();

        if (!permitido) {
            console.log('El usuario no concedió permisos');
            return;
        }

        const key = await getPublicKey();

        const subscription = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        });

        await fetch('api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription.toJSON())
        });

        verificaSuscripcion(subscription);

    } catch (err) {
        console.error('Error al activar notificaciones push:', err);
    }

});


function cancelarSuscripcion() {

    swReg.pushManager.getSubscription().then( subs => {

        subs.unsubscribe().then( () =>  verificaSuscripcion(false) );

    });


}

btnPushDemo.on('click', function() {

    var payload = {
        titulo: 'Chat de Superhéroes',
        cuerpo: 'Mensaje especial para ' + (usuario || 'spiderman') + '. Revisa las acciones.',
        usuario: usuario || 'spiderman',
        icon: 'img/icons/icon-192x192.png',
        badge: 'img/favicon.ico',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        tag: 'chat-demo',
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
        actions: [
            { action: 'open-chat', title: 'Abrir chat', icon: 'img/avatars/spiderman.jpg' },
            { action: 'close-notification', title: 'Cerrar', icon: 'img/avatars/ironman.jpg' }
        ],
        data: {
            url: '/',
            user: usuario || 'spiderman'
        }
    };

    fetch('api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function() {
        $.mdtoast('Push de ejemplo enviada', {
            interaction: true,
            interactionTimeout: 1200,
            actionText: 'OK!'
        });
    })
    .catch(function(err) {
        console.log('Error al enviar push demo', err);
    });

});

monitorearPermisosNotificacion();

btnActivadas.on( 'click', function() {

    cancelarSuscripcion();


});
