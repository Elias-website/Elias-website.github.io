// IIFE (Immediately Invoked Function Expression) for å unngå å forurense det globale omfanget
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
        stockData[product.id] = product.stock;
      });

      // Sjekk om stockData allerede finnes i localStorage
      const existingStockData = JSON.parse(localStorage.getItem('stockData')) || {};

      // Oppdater kun lageret hvis det ikke finnes eller hvis det er utdatert
      const isStockSynced = Object.keys(stockData).every(
        id => existingStockData[id] !== undefined && existingStockData[id] <= stockData[id]
      );

      if (!isStockSynced) {
        localStorage.setItem('stockData', JSON.stringify(stockData));
        console.log("Lagerdata synkronisert med products.json");
      }
    });
  }

  // Function to initialize or sync product data in localStorage
  function initializeProductData() {
    $.getJSON('produkter/products.json', function (products) {
      const productData = {};
      products.forEach(product => {
        productData[product.id] = {
          name: product.name,
          price: product.price,
          image: product.image
        };
      });

      // Check if productData already exists in localStorage
      if (!localStorage.getItem('productData')) {
        localStorage.setItem('productData', JSON.stringify(productData));
        console.log("Product data initialized in localStorage.");
      }
    });
  }

  // Oppdater lageret når et produkt legges til i handlekurven
  window.updateStock = function(productId, quantity) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || {};
    if (stockData[productId] !== undefined) {
      if (stockData[productId] >= quantity) {
        stockData[productId] -= quantity;
        localStorage.setItem('stockData', JSON.stringify(stockData));
        $(`.product-card[data-product-id="${productId}"] .stock-count`).text(`På lager: ${stockData[productId]}`); // Update stock display
      } else {
        alert("Ikke nok produkter på lager!");
      }
    } else {
      console.error("Produkt-ID finnes ikke i lagerdata.");
    }
  }

  // Gjør addToCart tilgjengelig globalt
  window.addToCart = function(product) {
    // Hent handlekurven fra localStorage på nytt for å sikre synkronisering
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    const stockData = JSON.parse(localStorage.getItem('stockData')) || {};
    const availableStock = stockData[product.id] || 0;

    var existingProduct = cart.find(function (item) {
      return item.id === product.id;
    });

    if (existingProduct) {
      if (availableStock >= 0) { 
        existingProduct.quantity += 1; // Øk antallet i handlekurven med 1
      } else {
        return;
      }
    } else {
      if (availableStock == 0) {
        alert("Produktet er utsolgt!");
        return;
      }
      product.quantity = 1;
      cart.push(product);
    }

    // Oppdater lageret med riktig mengde
    updateStock(product.id, 1);

    // Oppdater localStorage med den nye handlekurven
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    console.log("Produkt lagt til i handlekurven:", product);
  };

  // jQuery's document ready-funksjon for å sikre at DOM-en er fullstendig lastet før koden kjøres
  $(document).ready(function () {
    console.log("Dokument klart"); // Logg at dokumentet er klart

    // Initialize or sync product data
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
        id: $(this).closest(".product-card").data("product-id"),
        name: $(this).closest(".product-card").find("h3").text(),
        price: $(this).closest(".product-card").find(".price").text(),
        image: $(this).closest(".product-card").find("img").attr("src")
      };
      // Legg produktet til i handlekurven
      addToCart(product);
    });
  });
})();
