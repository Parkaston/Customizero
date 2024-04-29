
document.addEventListener('DOMContentLoaded', async () => {
  const {publishableKey} = await fetch('/config').then (r=>r.json());
const stripe = Stripe(publishableKey);

const elements = stripe.elements();
 const cardElement = elements.create('card', {
   iconStyle: 'solid',
    style: {
      base: {
        color: "black",

        fontWeight: 500,
        fontSize: "16px",

        "::placeholder": {
          color: "#CFD7DF"
        }
      },
      invalid: {
        color: "#E25950"
      }
    }
  });
 cardElement.mount('#card-element');
const form = document.querySelector('#payment-form');

form.addEventListener('submit', async (e) => {
  addMessage('Ingresando datos al sistema de pagos.');
  e.preventDefault();
  const {error: backendError ,clientSecret} = await fetch(
      '/create-payment-intent',
        {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
              paymentMethodType: 'card',
              currency: 'eur',

            }),
          }
             ).then((r) => r.json());
if (backendError)
{

addMessage(backendError.message);
return;

}
addMessage('Procesando pago...');
const nameInput = document.querySelector('#name');
const {error: stripeError, paymentIntent} = await stripe.confirmCardPayment(
  clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: nameInput.value
      }
    }
  }
)
if(stripeError)
{
addMessage("Error al procesar el pago: " + stripeError.message);
return ;
}

if (paymentIntent.status === 'succeeded')
{
addMessage("El pago ha sido satisfactorio! Seras redireccionado a la pagina de inicio")
window.location.replace("https://customizero.com/success");
}

});
});


const addMessage = (message) => {
  const messagesDiv = document.querySelector('#messages');
  messagesDiv.style.display = 'block';
  messagesDiv.innerHTML = '>' + message + '<br>';
  console.log('StripeSampleDebug: ', message);
};
