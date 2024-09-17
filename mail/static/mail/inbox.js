document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(undefined, ''));

  // By default, load the inbox
  load_mailbox('inbox');
});



window.onpopstate = function(event) {
  // since we pushed section number data to each "webpage"'state
  if (event.state.mailbox === "compose") {
    send_email(event.state.email_id, event.state.mailbox);
  } else if (event.state.mailbox === "render-email") {
    openEmail(event.state.email_id, event.state.mailbox)
  } else {
    display_mailbox(event.state.mailbox);
  }
}



function compose_email(email_id, mailbox) {
  history.pushState({email_id: email_id, mailbox: 'compose'}, "", ``);

  send_email(email_id, mailbox)
  
}



function send_email(email_id, mailbox) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none'; //hide
  document.querySelector('#compose-view').style.display = 'block'; //show
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  if (email_id === undefined) {
    document.querySelector('#compose-recipients').readOnly = false;
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  } else {
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(data => {
      if (mailbox === "sent") {
        document.querySelector('#compose-recipients').value = data.recipients;
        document.querySelector('#compose-recipients').readOnly = true;
        document.querySelector('#compose-subject').value = `Re: ${data.subject}`;
        document.querySelector('#compose-body').value = `On ${data.timestamp} ${data.sender} wrote:\n${data.body}`;

      } else {
        document.querySelector('#compose-recipients').value = data.sender;
        document.querySelector('#compose-recipients').readOnly = true;
        document.querySelector('#compose-subject').value = `Re: ${data.subject}`;
        document.querySelector('#compose-body').value = `On ${data.timestamp} ${data.sender} wrote:\n${data.body}`;
      }
    })
    .catch(error => {
      console.log('Error:', error)
    });
  }
  




  document.querySelector('#compose-form').onsubmit = function() {
    // .value returns the user input from input field after submitted
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    console.log('Sending data:', { recipients, subject, body });

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {

      if (result.message) {
        show_message("alert1", result.message);

      } else if (result.error) {
        show_message("alert2", result.error);

      } else {
        console.log('Unexpected response:', result);
      }

    })
    .catch(error => {
      console.log('Error:', error)
    });
    
    return false;
  }; 
}






function show_message(alert, message) {
  const message_div = document.querySelector(`#${alert}`);
        message_div.style.display = "block";
        message_div.innerHTML = message;
        load_mailbox("sent");
        setTimeout(function() {
          message_div.style.display = 'none';
        }, 2000);
}




function load_mailbox(mailbox) {

  history.pushState({mailbox: mailbox}, "", ``);

  display_mailbox(mailbox);
}





function display_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block'; //show
  document.querySelector('#compose-view').style.display = 'none'; //hide
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  const title = document.querySelector('h3')
  title.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(data => {
    document.querySelector('#emails-view-body').innerHTML = '';

    if (mailbox === 'sent') {
      data.forEach(email => render_sent(email, mailbox));
    }
    else {
      data.forEach(email => render_email(email, mailbox));
    }
  })
  .catch(error => {
    console.log('Error:', error)
  });
}





function render_email(email_object, mailbox) {

  // Create a new email
  const email = document.createElement('div');
  email.className = 'emails-item';

  if (localStorage.getItem(`clicked/${email_object.id}`) === 'true') {
    email.style.background = 'grey';
  } else if (!localStorage.getItem(`clicked/${email_object.id}`)) {
    localStorage.setItem(`clicked/${email_object.id}`, 'false');
  }

  email.onclick = function() {
    if (localStorage.getItem(`clicked/${email_object.id}`) === 'false') {
      localStorage.setItem(`clicked/${email_object.id}`, 'true');
    }
    render(email_object.id, mailbox);
  };

  email.append(createSpan(email_object.sender))
  email.append(createSpan(email_object.subject))
  email.append(createSpan(email_object.timestamp))
  document.querySelector('#emails-view-body').append(email);
}




function render_sent(email_object, mailbox) {

  // Create a new email
  const email = document.createElement('div');
  email.className = 'emails-item';

  if (localStorage.getItem(`clicked/${email_object.id}`) === 'true') {
    email.style.background = 'grey';
  } else if (!localStorage.getItem(`clicked/${email_object.id}`)) {
    localStorage.setItem(`clicked/${email_object.id}`, 'false');
  }

  email.onclick = function() {
    if (localStorage.getItem(`clicked/${email_object.id}`) === 'false') {
      localStorage.setItem(`clicked/${email_object.id}`, 'true');
    }
    render(email_object.id, mailbox);
  };
  
  email.append(createSpan(email_object.recipients))
  email.append(createSpan(email_object.subject))
  email.append(createSpan(email_object.timestamp))
  document.querySelector('#emails-view-body').append(email);

}




function render(email_id, mailbox) {
  history.pushState({mailbox: 'render-email', email_id: email_id}, "", ``);

  openEmail(email_id, mailbox);
}




function openEmail(email_id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none'; 
  document.querySelector('#compose-view').style.display = 'none'; 
  document.querySelector('#email-view').style.display = 'block';

  document.querySelector('#email-view-reply').innerHTML = '';
  document.querySelector('#email-view-archive').innerHTML = '';

  // Show the mailbox name

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(data => {

    document.querySelector('#email-view-sender').innerHTML = data.sender;
    document.querySelector('#email-view-recipients').innerHTML = data.recipients;
    document.querySelector('#email-view-subject').innerHTML = data.subject;
    document.querySelector('#email-view-timestamp').innerHTML = data.timestamp;
    document.querySelector('#email-view-body').innerHTML = data.body;
    document.querySelector('#email-view-reply').append(createReply(email_id, mailbox));
    document.querySelector('#email-view-archive').append(createArchive(email_id, mailbox));

  })
  .catch(error => {
    console.log('Error:', error)
  });
}



function createArchive(email_id, mailbox) {

  if (mailbox === 'inbox') {
    const button = document.createElement('button');
    button.textContent = 'Archive'; 
    button.id = 'is_archive'; 

    button.addEventListener('click', () => archive_email(email_id, mailbox));
    return button;

  } else if (mailbox === 'archive') {
    const button = document.createElement('button');
    button.textContent = 'Unarchive'; 
    button.id = 'is_archive'; 

    button.addEventListener('click', () => archive_email(email_id, mailbox));
    return button;

  } else {
    return '';
  }

}


function archive_email(email_id, mailbox) {
  if (mailbox === "inbox") {
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
    .then(response => response.text())
    .then(data => {
      load_mailbox('inbox')
    })
    .catch(error => {
      console.log('Error:', error)
    });
    
    
  } else if (mailbox === "archive") {
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
    .then(response => response.text())
    .then(data => {
      load_mailbox('inbox')
    })
    .catch(error => {
      console.log('Error:', error)
    });
  }
}



function createSpan(content) {
  const span = document.createElement('span');
  span.innerHTML = content;
  return span;
}


function createReply(email_id, mailbox) {
  const button = document.createElement('button');
  button.textContent = 'Reply'; 
  button.id = 'reply'; 

  button.addEventListener('click', () => compose_email(email_id, mailbox));
  
  return button;
}