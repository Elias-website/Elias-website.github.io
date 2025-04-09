(function () {
  "use strict";
  var Widgets = function () {
    /**
     * En hjelper for å hente data trygt med en standardverdi.
     * @public
     * @param {*} v - den opprinnelige verdien.
     * @param {*} defaultVal - standardverdien som returneres når den opprinnelige er undefined.
     * @returns {*} - den opprinnelige verdien (hvis ikke undefined) eller standardverdien.
     */
    function safeGet(v, defaultVal) {
      if (typeof defaultVal === "undefined") defaultVal = "";
      return (typeof v === "undefined") ? defaultVal : v;
    }
    this.safeGet = safeGet;

    /**
     * Opprett en tilpasset fane.
     * @public
     * @param {Object} settings - innstillinger for den tilpassede fanen.
     */
    function createCustomTab(settings) {
      settings = safeGet(settings, {});

      // Angi velgeren for fanen
      var $selector = $(settings["selector"]);
      if ($selector.length == 0) {
        console.error("Kan ikke finne velger: " + settings["selector"]);
        return false;
      }
      if ($selector.length > 1) {
        console.error("Flere velgere ble funnet. Vennligst angi bare én om gangen.");
        return false;
      }

      // Hent menyartiklene
      var $menu_items = $selector.find(".custom-tab-menu-item");
      var $all_contents = $selector.find(".custom-tab-content");
      $menu_items.each(function (i, element) {
        var $element = $(element);
        var idx_content = $element.data("content");
        var $desired_content = $selector.find(".custom-tab-content[data-content=" + idx_content + "]");
        // Legg til klikkhendelse
        $element.on("click", function () {
          $all_contents.hide();
          $desired_content.css("display", "flex");
          $menu_items.removeClass("active");
          $element.addClass("active");
        });
      });
      $selector.find(".custom-tab-menu-item.active").click();
    }
    this.createCustomTab = createCustomTab;

    /**
     * Opprett en tilpasset dialog.
     * @public
     * @param {Object} settings - innstillinger for den tilpassede dialogen.
     */
    function createCustomDialog(settings) {
      settings = safeGet(settings, {});

      // Opprett en knapp for å utføre handlinger (f.eks. bekrefte at brukerne får meldingen)
      // Standardteksten for knappen er "Confirm"
      var has_action_callback = (typeof settings["action_callback"] === "function");
      var action_text = safeGet(settings["action_text"], "Confirm");

      // Opprett en knapp for avbrytelse
      // Standardteksten for knappen er "Cancel" når det er en handlingsknapp
      // Standardteksten for knappen er "Ok" når det ikke er en handlingsknapp
      var has_cancel_callback = (typeof settings["cancel_callback"] === "function");
      var cancel_text = has_action_callback ? "Cancel" : "Ok";
      cancel_text = safeGet(settings["cancel_text"], cancel_text);

      // Skjul avbryt-knappen eller ikke
      var show_cancel_btn = safeGet(settings["show_cancel_btn"], true);

      // Angi stilen
      var style_class = "custom-dialog-flat " + safeGet(settings["class"], "");

      // Angi velgeren for dialogen
      // Hvis ingen velger, opprettes en <div></div>
      var $selector = $(safeGet(settings["selector"], "<div></div>"));

      // Angi bredden på dialogen
      var width = safeGet(settings["width"], 260);

      // Angi om knappene skal være full bredde
      var full_width_button = safeGet(settings["full_width_button"], false);

      // Vis lukkeknappen eller ikke
      var show_close_button = safeGet(settings["show_close_button"], true);

      // Lukk dialogen når handlingsknappen klikkes eller ikke
      var close_dialog_on_action = safeGet(settings["close_dialog_on_action"], true);

      // Lukk dialogen når avbryt-knappen klikkes eller ikke
      var close_dialog_on_cancel = safeGet(settings["close_dialog_on_cancel"], true);

      // Reverser posisjonene til handlings- og avbryt-knappene
      var reverse_button_positions = safeGet(settings["reverse_button_positions"], false);

      // Angi knapper
      var buttons = [];
      if (show_cancel_btn) {
        var btn_class = "ui-cancel-button";
        if (full_width_button) {
          btn_class += " full-width";
        } else {
          btn_class += " stretch-on-mobile";
        }
        buttons.push({
          class: btn_class,
          text: cancel_text,
          click: function (event) {
            if (close_dialog_on_cancel) {
              $(this).dialog("close");
            }
            if (has_cancel_callback) settings["cancel_callback"](event);
          }
        });
      }
      if (has_action_callback) {
        var btn_class = "ui-action-button";
        if (full_width_button) {
          btn_class += " full-width";
        } else {
          btn_class += " stretch-on-mobile";
        }
        buttons.push({
          class: btn_class,
          text: action_text,
          click: function (event) {
            if (close_dialog_on_action) {
              $(this).dialog("close");
            }
            if (has_action_callback) settings["action_callback"](event);
          }
        });
      }

      // Reverser knappens posisjoner eller ikke
      if (buttons.length == 2 && reverse_button_positions) {
        var tmp = buttons[1];
        buttons[1] = buttons[0];
        buttons[0] = tmp;
      }

      // Opprett dialog
      var $selector_container;
      var dialog_settings = {
        autoOpen: false,
        resizable: false,
        height: "auto",
        draggable: false,
        width: width,
        modal: true,
        classes: {
          "ui-dialog": style_class
        }, // dette er for jquery 1.12 og etter
        dialogClass: style_class, // dette er for før jquery 1.12
        buttons: buttons,
        closeText: "",
        open: function (event, ui) {
          var num_opened_dialog = 0;
          $(".ui-dialog-content").each(function () {
            if ($(this).dialog("isOpen")) num_opened_dialog += 1;
          });
          // Større enn 1 etter åpning betyr at det finnes andre åpne dialogbokser
          var is_other_dialog_opened = num_opened_dialog > 1;
          // Sjekk om overordnet element er angitt
          if (!is_other_dialog_opened) {
            if (typeof settings["parent"] === "undefined") {
              var $body = $("body");
              if (!$body.hasClass("no-scroll") || !$body.hasClass("no-x-scroll")) {
                // Når dialogen er åpen, vil vi sette toppen av kroppen til rulleposisjonen
                document.body.style.top = -window.scrollY + "px";
                if (window.innerWidth > document.body.clientWidth) {
                  // Dette betyr at siden har en vertikal rullefelt
                  $body.addClass("no-x-scroll");
                } else {
                  // Dette betyr at siden ikke har en vertikal rullefelt
                  $body.addClass("no-scroll");
                }
              }
              $selector_container.css({
                position: "fixed",
                top: "calc(50% - " + ($selector_container.height() / 2) + "px)",
                margin: "0 auto",
                left: "0",
                right: "0",
                overflow: "hidden"
              });
            } else {
              // Hvis det er en overordnet, må du tilpasse overlegg til overordnet element
              var $overlay = $(".ui-widget-overlay");
              if (!$overlay.hasClass("fit-parent")) {
                $overlay.addClass("fit-parent");
              }
              $selector_container.css({
                margin: "0 auto",
                left: "0",
                right: "0"
              });
            }
          }
        },
        close: function (event, ui) {
          var num_opened_dialog = 0;
          $(".ui-dialog-content").each(function () {
            if ($(this).dialog("isOpen")) num_opened_dialog += 1;
          });
          // Større enn 0 etter lukking betyr at det finnes andre åpne dialogbokser
          var is_other_dialog_opened = num_opened_dialog > 0;
          if (!is_other_dialog_opened) {
            // Sjekk om overordnet element er angitt
            if (typeof settings["parent"] === "undefined") {
              var $body = $("body");
              if ($body.hasClass("no-scroll") || $body.hasClass("no-x-scroll")) {
                if ($body.hasClass("no-scroll")) {
                  $body.removeClass("no-scroll");
                }
                if ($body.hasClass("no-x-scroll")) {
                  $body.removeClass("no-x-scroll");
                }
                // Når dialogen er skjult, vil vi forbli på toppen av rulleposisjonen
                var scrollY = document.body.style.top;
                document.body.style.top = "";
                window.scrollTo(0, parseInt(scrollY || "0") * -1);
              }
            } else {
              // Hvis det er en overordnet, må du fjerne klassen som tilpasser overlegg til overordnet
              var $overlay = $(".ui-widget-overlay");
              if ($overlay.hasClass("fit-parent")) {
                $overlay.removeClass("fit-parent");
              }
            }
          }
        }
      };

      if (typeof settings["parent"] === "undefined") {
        dialog_settings["position"] = {
          my: "center",
          at: "center",
          of: window
        };
      } else {
        dialog_settings["appendTo"] = settings["parent"];
        dialog_settings["position"] = {
          my: "center",
          at: "center",
          of: settings["parent"]
        };
      }
      var $dialog = $selector.dialog(dialog_settings);
      $selector_container = $selector.closest(".ui-dialog");
      $selector_container.find(".ui-dialog-titlebar-close").empty().append("<i class='fa fa-times fa-lg'></i>");
      if (!show_close_button) {
        $dialog.on("dialogopen", function () {
          $(this).parent().find(".ui-dialog-titlebar-close").hide();
        });
      }
      return $dialog;
    }
    this.createCustomDialog = createCustomDialog;

    /**
     * Sett tilpasset rullegardinmeny.
     * @public
     * @param {Object} $ui - jQuery-objektet for rullegardinmenyen.
     * @param {Object} settings - innstillinger for rullegardinmenyen.
     */
    function setCustomDropdown($ui, settings) {
      var items = settings["items"]; // teksten som vises for hvert element
      var init_index = settings["init_index"];
      var init_text = settings["init_text"];
      var on_item_click_callback = settings["on_item_click_callback"];
      var on_item_create_callback = settings["on_item_create_callback"];
      var $menu = $ui.find("div").empty();
      var $button_text = $ui.find("a > span").text("");
      var $selected_item;
      // Angi initial knappetekst
      if (typeof init_text !== "undefined") {
        $button_text.text(init_text);
      } else {
        if (typeof init_index !== "undefined" && typeof items !== "undefined") {
          $button_text.text(items[init_index]);
        }
      }
      // Angi knappehendelse
      // Merk at knappen er designet for å bruke focusout og focus for å bestemme tilstanden
      // "focusout" indikerer at menyen er åpen og bør lukkes
      // "focus" indikerer at menyen er lukket og bør åpnes
      $ui.find("a").off("focusout").on("focusout", function () {
        // Finn hvilket element som er valgt, og simuler klikket
        if (typeof $selected_item !== "undefined") {
          $button_text.text($selected_item.text()); // oppdater teksten på knappen
          if (typeof on_item_click_callback === "function") on_item_click_callback($selected_item, $selected_item.index());
          $selected_item = undefined;
        }
        if ($menu.is(":visible")) $menu.addClass("force-hide"); // lukk menyen
      }).off("focus").on("focus", function () {
        if (!$menu.is(":visible")) $menu.removeClass("force-hide"); // åpne menyen
      });
      // Legg til hendelser for menyartikler
      for (var i = 0; i < items.length; i++) {
        var $item = $("<a href=\"javascript:void(0)\">" + items[i] + "</a>");
        // Vi må la focusout-knappehendelsen vite hvilket element som er valgt
        // Merk at vi ikke kan bruke klikkhendelsen for å finne dette,
        // fordi så snart elementet er klikket,
        // utløses focusout-hendelsen til knappen,
        // dette lukker menyen og vi får aldri klikkhendelsen fra elementene
        $item.on("mouseover", function () {
          $selected_item = $(this);
        }).on("mouseout", function () {
          $selected_item = undefined;
        });
        $menu.append($item);
        if (typeof on_item_create_callback === "function") on_item_create_callback($item, i);
      }
      return $ui;
    }
    this.setCustomDropdown = setCustomDropdown;

    /**
     * Sett tilpasset legende.
     * @public
     * @param {Object} $ui - jQuery-objektet for legenden.
     * @param {Object} settings - innstillinger for legenden.
     */
    function setCustomLegend($ui, settings) {
      settings = safeGet(settings, {});
      $ui.accordion({
        collapsible: true,
        animate: safeGet(settings["animate"], false)
      });
      return $ui;
    }
    this.setCustomLegend = setCustomLegend;

    /**
     * Kopier tekst i et inndatafelt.
     * @public
     * @param {string} element_id - ID-en til elementet som inneholder teksten som skal kopieres.
     */
    function copyText(element_id) {
      // Hent tekstfeltet
      var c = document.getElementById(element_id);
      // Velg tekstfeltet
      c.select();
      c.setSelectionRange(0, 99999); // For mobile enheter
      // Kopier teksten inne i tekstfeltet
      navigator.clipboard.writeText(c.value);
    }
    this.copyText = copyText;

    /**
     * Endre størrelse på en jQuery-dialog for å passe til skjermen.
     * @public
     * @param {Object} $dialog - et jQuery-dialogobjekt.
     */
    function fitDialogToScreen($dialog) {
      var $window = $(window);
      $dialog.parent().css({
        "width": $window.width(),
        "height": $window.height(),
        "left": 0,
        "top": 0
      });
      $dialog.dialog("option", "height", $window.height());
      $dialog.dialog("option", "width", $window.width());
    }
    this.fitDialogToScreen = fitDialogToScreen;

    /**
     * Opprett HTML-elementene for et bilde fra Unsplash.
     * @private
     * @param {string} credit - krediteringen av bildet.
     * @param {string} imageUrl - kilde-URL-en til et bilde for bildet.
     * @returns {Object} - et jQuery DOM-objekt.
     */
    function createUnsplashPhotoHTML(credit, imageUrl) {
      var html = '<figure style="display: none;"><img src="' + imageUrl + '"><div>' + credit + '</div></figure>';
      var $html = $(html);
      $html.find("img").one("load", function () {
        // Vis bare figuren når bildet er lastet
        $(this).parent().show();
      });
      return $html;
    }

    /**
     * Opprett og vis bildevelgerdialogen (tilpasset for Unsplash API).
     * @public
     * @param {string} uniqueId - den unike ID-en for DOM-elementene.
     * @param {Object} dialogData - ordboken som skal lagres i "raw"-feltet til dialog-DOM-en.
     * @param {string} photoURL - URL-en for å få json returnert av Unsplash API.
     * @param {function} [onselect] - tilbakeringingsfunksjon etter bekreftelse av bildevalg.
     * @returns {Object} - et jQuery-objekt av dialogen.
     */
    function createUnsplashPhotoPickerDialog(uniqueId, dialogData, photoURL, onselect) {
      // Opprett HTML
      var html = '';
      html += '<div id="' + uniqueId + '" title="Photo Picker" data-role="none" style="display: none;">';
      html += '  <p class="text dialog-photo-picker-text">';
      html += '    Søk etter bilder ved hjelp av <a href="https://unsplash.com/" target="_blank">Unsplash</a> og velg ett:';
      html += '  </p>';
      html += '  <form class="search-box-container">';
      html += '  <input class="custom-textbox search-box" placeholder="Enter search terms">';
      html += '    <button title="Search photos" type="submit" class="search-box-button">';
      html += '      <svg width="32" height="32" class="search-box-icon" version="1.1" viewBox="0 0 32 32" aria-hidden="false">';
      html += '        <path d="M22 20c1.2-1.6 2-3.7 2-6 0-5.5-4.5-10-10-10S4 8.5 4 14s4.5 10 10 10c2.3 0 4.3-.7 6-2l6.1 6 1.9-2-6-6zm-8 1.3c-4 0-7.3-3.3-7.3-7.3S10 6.7 14 6.7s7.3 3.3 7.3 7.3-3.3 7.3-7.3 7.3z"></path>';
      html += '      </svg>';
      html += '    </button>';
      html += '  </form>';
      html += '  <p class="text custom-text-danger photos-masonry-error-message">No images found. Please search again using other terms.</p>';
      html += '  <div class="masonry"></div>';
      html += '</div>';
      var $html = $(html);
      $(document.body).append($html);

      // Opprett dialog
      var $imagePickerDialog = createCustomDialog({
        "selector": "#" + uniqueId,
        "action_text": "Select",
        "width": 290,
        "class": "dialog-photo-picker",
        "show_cancel_btn": false,
        "action_callback": function () {
          var d = $($html.find(".masonry").find(".selected")[0]).data("raw");
          if (typeof onselect == "function") {
            onselect(d, $imagePickerDialog);
          }
        }
      });
      $imagePickerDialog.dialog("widget").find("button.ui-action-button").prop("disabled", true);
      $imagePickerDialog.data("raw", dialogData);

      // Håndter bildesøk
      $html.find(".search-box-container").on("submit", function (event) {
        event.preventDefault();
        var search = $html.find(".search-box").blur().val();
        if (search == "") {
          console.log("no search term");
        } else {
          var targetPhotoURL;
          if (typeof photoURL === "undefined") {
            targetPhotoURL = "file/photo.json";
          } else {
            targetPhotoURL = photoURL + "&query=" + search;
          }
          $.getJSON(targetPhotoURL, function (data) {
            $html.find(".photos-masonry-error-message").hide();
            var $photos = $html.find(".masonry").empty().show();
            for (var i = 0; i < data.length; i++) {
              var d = data[i];
              var imageUrl = d["urls"]["regular"];
              var credit = 'Credit: <a href="' + d["user"]["links"]["html"] + '" target="_blank">' + d["user"]["name"] + '</a>';
              var $d = createUnsplashPhotoHTML(credit, imageUrl);
              $d.data("raw", d);
              $photos.append($d);
            }
            $photos.find("figure").on("click", function () {
              if ($(this).hasClass("selected")) {
                $(this).removeClass("selected");
                $imagePickerDialog.dialog("widget").find("button.ui-action-button").prop("disabled", true);
              } else {
                $photos.find(".selected").removeClass("selected");
                $(this).addClass("selected");
                $imagePickerDialog.dialog("widget").find("button.ui-action-button").prop("disabled", false);
              }
            });
          }).fail(function () {
            $html.find(".masonry").empty().hide();
            $html.find(".photos-masonry-error-message").show();
          });
        }
      });

      // Fokuser på søkeboksen
      $html.find(".search-box").focus();

      // Håndter vindusstørrelse
      $(window).resize(function () {
        fitDialogToScreen($imagePickerDialog);
      });
      fitDialogToScreen($imagePickerDialog);

      return $imagePickerDialog;
    }
    this.createUnsplashPhotoPickerDialog = createUnsplashPhotoPickerDialog;
  };

  // Registrer til vinduet
  if (window.edaplotjs) {
    window.edaplotjs.Widgets = Widgets;
  } else {
    window.edaplotjs = {};
    window.edaplotjs.Widgets = Widgets;
  }
})();