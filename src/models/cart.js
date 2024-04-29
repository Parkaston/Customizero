module.exports = function Cart(oldCart) {
  this.items = oldCart.items || {};
  this.totalQty = oldCart.totalQty || 0;
  this.totalPrice = oldCart.totalPrice || 0;


  this.add = function(item) {
    var quantity = this.totalQty;

      storedItem = this.items[quantity] = {
        item: item,
        qty: 0,
        price: 0,
        fraseDelantera:"Ninguna",
        fraseTrasera:"Ninguna",
        posicion: quantity,
        cajaDeRegalo:false,
        foto:"SinFoto",
        fotoAgregada: false
      };

    storedItem.qty++;
    storedItem.price = storedItem.item.precio;
    this.totalQty++;
    this.totalPrice += storedItem.item.precio;
    console.log(this.totalQty);
  };


this.cambiarFraseDelantera = function(posicion, frase)
{
  this.items[posicion].fraseDelantera = frase
}
this.cambiarFraseTrasera = function(posicion, frase)
{
  this.items[posicion].fraseTrasera = frase
}
this.agregarfoto = function(posicion,foto)
{
this.items[posicion].fotoAgregada = true;
this.items[posicion].foto = foto;
}
  this.generateArray = function() {
    var arr = [];
    for (var quantity in this.items) {

      arr.push(this.items[quantity]);
    }
    return arr;

  };

this.agregarUno = function(posicion)

{
this.totalPrice+=this.items[posicion].item.precio;
this.items[posicion].qty++;
console.log("Ahora hay "+ this.items[posicion].qty +"De este objeto")
this.items[posicion].price = this.items[posicion].item.precio * this.items[posicion].qty;
console.log(this.totalQty);
}


this.eliminar = function(posicion)

{
  this.totalQty = this.totalQty-1;
  this.totalPrice-=this.items[posicion].price;
  delete this.items[posicion];

  console.log(this.totalQty);
}

this.quitarUno = function (posicion)
{
this.totalPrice-=this.items[posicion].item.precio;
this.items[posicion].qty--;
this.items[posicion].price = this.items[posicion].item.precio * this.items[posicion].qty;
console.log(this.items[posicion].qty)
if (this.items[posicion].qty <= 0) {
this.eliminar(posicion);
console.log("tuve que eliminar el elemento porque no habia mas");
   }


}


this.toggleCajaDeRegalo = function(posicion)
{
console.log("Inicialmente el valor es de " + this.items[posicion].cajaDeRegalo);
this.items[posicion].cajaDeRegalo = !this.items[posicion].cajaDeRegalo;
console.log(this.items[posicion].cajaDeRegalo);
}



};
