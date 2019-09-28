var AWS = require('aws-sdk');

var handler = function() {  
    var dynamodb = new AWS.DynamoDB({    
        apiVersion: '2012-08-10',​
        endpoint: 'http://localhost:8000'​,    
        region: 'us-west-2',    
        credentials: {      
            accessKeyId: '2345',      
            secretAccessKey: '2345'    
        }  
    });  

var docClient = new AWS.DynamoDB.DocumentClient({
        apiVersion: '2012-08-10',
        service: dynamodb
          });
        }

exports.handler = (event, context, callback) => {

        let envio = JSON.parse(event.body) || false;
        let id = (event.pathParameters || {}).idEnvio || false;
        let path_pendientes = event.path.includes('/envios/pendientes');
        let path_entregado = event.path.includes('/entregado');
        
        switch (event.httpMethod) { //switch para post o get
            case "GET":
                if (path_pendientes) {
                    var params = {
                        TableName: 'envio',
                        IndexName: 'enviosPendienteIndex'
                    };
                    dynamodb.scan(params, function (err, data) {//scan para que nos devuelva los items
                        if (err) {
                            console.log(`error`, err);
                            callback(err, null);
                        }
                        else {
                            console.log(`success: returned ${data.Items}`);
                            callback(null, response(200, parseItems(data.Items)));
                        }
                    });
                    break;
                    }
                if (id) {
                    var params = {
                        TableName: 'envio',
                        Key: {
                            id: id
                        }
                    };
                    docClient.get(params, function (err, data) { //recupero los valores de docclient
                        if (err) {
                            console.log(`error`, err);
                            callback(err, null);
                        }
                        else {
                            console.log(`success: returned ${data.Item}`);
                            callback(null, response(200, parseItems(data.Items)));
                        }
                    });
                    break;
                }
                var params = {
                    TableName: 'envio'
                };
                dynamodb.scan(params, function (err, data) {
                    if (err) {
                        console.log(`error`, err);
                        callback(err, null);
                    }
                    else {
                        console.log(`success: returned ${data.Items}`);
                        callback(null, response(200, parseItems(data.Items)));
                    }
                });
                break;
            case "POST":
                if (path_entregado && id) {
                    var params = {
                        TableName: 'envio',
                        Key: {
                            id: id
                        },
                        UpdateExpression: 'remove pendiente',
                        ReturnValues: 'ALL_NEW'
                    };
                    docClient.update(params, function (err, data) { //actualizando valores de docclient
                        if (err) {
                            console.log(`error`, err);
                            callback(err, null);
                        }
                        else {
                            console.log(`success: returned ${data.Attributes}`);
                            callback(null, response(200, data.Attributes));
                        }
                    });
                }
                if (envio) {
                    var params = {
                        TableName: 'envio',
                        Item: envio
                    };
                    docClient.put(params, function (err, data) {//put con docclient para envio
                        if (err) {
                            console.log(`error`, err);
                            callback(err, null);
                        }
                        else {
                            console.log(`success: created ${envio}`);
                            callback(null, response(200, envio));
                        }
                    });
                }
                break;
            default:
                console.log("Metodo no soportado (" + event.httpMethod+ ")");
        }

        function response(status, data) { //funcion para maenjar la respuesta
            var response = {
                statusCode: status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                    'Access-Control-Allow-Origin': `https://localhost:3000`,
                },
                body: JSON.stringify(data),
                isBase64Encoded: false
            }
            return response;
        }

        function parseItems(listOfItems) {
            var list = [];
            listOfItems.forEach(element => {
            list.push(parseItem(element))
            });
            return list;
        }
        
        function getSafe(fn, defaultVal) {
            try {
                return fn();
            } catch (e) {
                return defaultVal;
            }
        }
        
        function parseItem(Item) {
            let id = getSafe(() => Item.id.S, ''),
                fechaAlta = getSafe(() => Item.fechaAlta.S, ''),
                destino = getSafe(() => Item.destino.S, ''),
                email = getSafe(() => Item.email.S, ''),
                pendiente = getSafe(() => Item.pendiente.S, ''),
                salida = getSafe(() => Item.salida.S, '');
        
            var response = {
                id: id,
                fechaAlta: fechaAlta,
                destino: destino,
                email: email,
                pendiente: pendiente,
                salida: salida
            }
            return response;
        }
    }