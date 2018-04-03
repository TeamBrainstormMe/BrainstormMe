(function () {

    console.log('Requesting Capability Token...');
    $.getJSON('/token')
      .done(function (data) {
        console.log('Got a token.');
        console.log('Token: ' + data.token);
  
        // Setup Twilio.Device
        Twilio.Device.setup(data.token);
  
        Twilio.Device.ready(function (device) {
          console.log('Twilio.Device Ready!');
        });
  
        Twilio.Device.error(function (error) {
          console.log('Twilio.Device Error: ' + error.message);
        });
  
        Twilio.Device.connect(function (conn) {
          console.log('Successfully established call!');
        });
  
        Twilio.Device.disconnect(function (conn) {
          console.log('Call ended.');
        });
  
        Twilio.Device.incoming(function (conn) {
          console.log('Incoming connection from ' + conn.parameters.From);
            conn.accept();
        });
  
      })
      .fail(function () {
        console.log('Could not get a token from server!');
      });

    const callBtn = document.getElementById('call');
    callBtn.addEventListener('click', () => {
        callBtn.style.backgroundColor = 'rgba(153, 255, 51, 0.5)';
        Twilio.Device.connect();
    }); 
})();
 
