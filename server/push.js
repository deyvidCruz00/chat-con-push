
const fs = require('fs');


const vapid = require('./vapid.json');

const webpush = require('web-push');

const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:tu_correo_institucional@tuuniversidad.edu.co';

webpush.setVapidDetails(
    vapidSubject,
    vapid.publicKey,
    vapid.privateKey
  );




let suscripciones = require('./subs-db.json');


module.exports.getKey = () => {
    return vapid.publicKey;
};



module.exports.addSubscription = ( suscripcion ) => {
    const existe = suscripciones.some(subs => subs.endpoint === suscripcion.endpoint);

    if (existe) {
        console.log('Suscripción ya existe, no se duplica');
        return;
    }

    console.log('Antes enviar suscripción ');
    suscripciones.push( suscripcion );

    console.log('antes modificar subs-db.json');
    fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );
    console.log('Nueva suscripción agregada');
};


module.exports.sendPush = ( post ) => {

    console.log('Mandando PUSHES');

    const notificacionesEnviadas = [];


    suscripciones.forEach( (suscripcion, i) => {


        const pushProm = webpush.sendNotification( suscripcion , JSON.stringify( post ) )
            .then(() => console.log( 'Notificacion enviada ') )
            .catch( err => {

                console.log('Notificación falló');

                if ( err.statusCode === 410 || err.statusCode === 404 ) {
                    suscripciones[i].borrar = true;
                }

            });

        notificacionesEnviadas.push( pushProm );

    });

    Promise.all( notificacionesEnviadas ).then( () => {


        suscripciones = suscripciones.filter( subs => !subs.borrar );

        fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );

    });

}

