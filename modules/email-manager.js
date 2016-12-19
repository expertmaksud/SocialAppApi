

var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);;

exports.sendReminderEmail = sendReminderEmail;



function sendReminderEmail(email, password,callback)
{
	
sendgrid.send({
  to:       email,
  from:     'noreply@famemonkey.com',
  subject:  'Password',
  text:     "You're password is " + password
}, function(err, json) {
  //if (err) { return console.error(err); }
  console.log(json);

  callback()
});
}