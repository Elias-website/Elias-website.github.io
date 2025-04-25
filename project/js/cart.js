// IIFE (Umiddelbart Kjørt Funksjonsuttrykk) for å unngå å forurense det globale omfanget
(function () {
  "use strict"; // Aktiver streng modus for bedre feilsjekking

  // Hent handlekurven fra localStorage eller initialiser den som en tom array hvis den ikke finnes
  var cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Funksjon for å oppdatere antall varer i handlekurven som vises på siden
  window.updateCartCount = function() {
    // Beregn totalt antall varer i handlekurven
    var totalCount = cart.reduce(function (acc, product) {
      return acc + product.quantity;
    }, 0);
    // Oppdater elementet for antall varer i handlekurven med totalantallet
    $(".cart-count").text(totalCount);
    console.log("Antall varer i handlekurven oppdatert:", totalCount); // Logg det oppdaterte antallet til konsollen
  }

  // Funksjon for å initialisere eller synkronisere lagerdata i localStorage
  function initializeStock() {
    $.getJSON('produkter/products.json', function (products) {
      const stockData = {};
      products.forEach(product => {
        stockData[product.id] = product.stock; // Lagre lagerbeholdningen for hvert produkt
      });

      // Sjekk om stockData allerede finnes i localStorage
      const existingStockData = JSON.parse(localStorage.getItem('stockData')) || {};

      // Oppdater kun lageret hvis det ikke finnes eller hvis det er utdatert
      const isStockSynced = Object.keys(stockData).every(
        id => existingStockData[id] !== undefined && existingStockData[id] <= stockData[id]
      );

      if (!isStockSynced) {
        localStorage.setItem('stockData', JSON.stringify(stockData));
        console.log("Lagerdata synkronisert med products.json"); // Logg at lagerdata er synkronisert
      }
    });
  }

  // Funksjon for å initialisere eller synkronisere produktdata i localStorage
  function initializeProductData() {
    $.getJSON('produkter/products.json', function (products) {
      const productData = {};
      products.forEach(product => {
        productData[product.id] = {
          name: product.name, // Navn på produktet
          price: product.price, // Pris på produktet
          image: product.image // Bilde av produktet
        };
      });

      // Sjekk om productData allerede finnes i localStorage
      if (!localStorage.getItem('productData')) {
        localStorage.setItem('productData', JSON.stringify(productData));
        console.log("Produktdata initialisert i localStorage."); // Logg at produktdata er initialisert
      }
    });
  }

  // Oppdater lageret når et produkt legges til i handlekurven
  window.updateStock = function(productId, quantity) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || {};
    if (stockData[productId] !== undefined) {
      if (stockData[productId] >= quantity) {
        stockData[productId] -= quantity; // Reduser lagerbeholdningen med antallet som legges til i handlekurven
        localStorage.setItem('stockData', JSON.stringify(stockData));
        $(`.product-card[data-product-id="${productId}"] .stock-count`).text(`På lager: ${stockData[productId]}`); // Oppdater lagerbeholdningen som vises på siden
      } else {
        alert("Ikke nok produkter på lager!"); // Vis en advarsel hvis det ikke er nok på lager
      }
    } else {
      console.error("Produkt-ID finnes ikke i lagerdata."); // Logg en feil hvis produktet ikke finnes i lagerdata
    }
  }

  // Gjør addToCart tilgjengelig globalt
  window.addToCart = function(product) {
    // Hent handlekurven fra localStorage på nytt for å sikre synkronisering
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    const stockData = JSON.parse(localStorage.getItem('stockData')) || {};
    const availableStock = stockData[product.id] || 0; // Sjekk tilgjengelig lagerbeholdning

    var existingProduct = cart.find(function (item) {
      return item.id === product.id;
    });

    if (existingProduct) {
      if (availableStock >= 0) { 
        existingProduct.quantity += 1; // Øk antallet i handlekurven med 1
      } else {
        return; // Avslutt hvis det ikke er nok på lager
      }
    } else {
      if (availableStock == 0) {
        alert("Produktet er utsolgt!"); // Vis en advarsel hvis produktet er utsolgt
        return;
      }
      product.quantity = 1; // Sett antallet til 1 for nye produkter
      cart.push(product); // Legg til produktet i handlekurven
    }

    // Oppdater lageret med riktig mengde
    updateStock(product.id, 1);

    // Oppdater localStorage med den nye handlekurven
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    console.log("Produkt lagt til i handlekurven:", product); // Logg produktet som ble lagt til
  };

  // jQuery's document ready-funksjon for å sikre at DOM-en er fullstendig lastet før koden kjøres
  $(document).ready(function () {
    console.log("Dokument klart"); // Logg at dokumentet er klart

    // Initialiser eller synkroniser produktdata
    initializeProductData();

    // Initialiser eller synkroniser lagerdata
    initializeStock();

    // Oppdater antall varer i handlekurven når siden lastes
    updateCartCount();

    // Legg til en klikkhendelseslytter til alle elementer med klassen "buy-button"
    $(".buy-button").off("click").on("click", function (e) {
      e.preventDefault(); // Forhindre standardhandlingen for klikkhendelsen (f.eks. å følge en lenke)
      // Opprett et produktobjekt med navnet, prisen og bildet av det klikkede produktet
      var product = {
        id: $(this).closest(".product-card").data("product-id"), // Hent produkt-ID fra data-attributtet
        name: $(this).closest(".product-card").find("h3").text(), // Hent produktnavnet fra h3-elementet
        price: $(this).closest(".product-card").find(".price").text(), // Hent prisen fra elementet med klassen "price"
        image: $(this).closest(".product-card").find("img").attr("src") // Hent bildeadressen fra img-elementet
      };
      // Legg produktet til i handlekurven
      addToCart(product);
    });
  });
})();
