/* Changue title */

document.addEventListener("visibilitychange", () => {
  const favicon = document.getElementById("favicon");
  if (document.hidden) {
    favicon.href = "./assets/img/diente_triste.png"; // Cambia el atributo `href` al nuevo icono.
    document.title = "🥹¡Regresa, tu diente te necesita!😢";
  } else {
    favicon.href = "./assets/img/logo.png"; // Cambia el atributo `href` al nuevo icono.
    document.title = "Imagen Dental";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  /* faqs */
  const accordions = document.querySelectorAll(".accordion");

  accordions.forEach((accordion) => {
    const toggle = accordion.querySelector(".accordion-toggle");
    const content = accordion.querySelector(".accordion-content");
    const icon = toggle.querySelector(".icon");

    toggle.addEventListener("click", () => {
      const isOpen = content.classList.contains("open");

      // Cierra todos los demás acordeones
      document
        .querySelectorAll(".accordion-content.open")
        .forEach((openContent) => {
          openContent.classList.remove("open");
          openContent.style.maxHeight = "0";
          openContent.parentElement
            .querySelector(".icon")
            .classList.remove("rotate");
        });

      // Abre o cierra el acordeón actual
      if (!isOpen) {
        content.classList.add("open");
        content.style.maxHeight = content.scrollHeight + "px";
        icon.classList.add("rotate");
      } else {
        content.classList.remove("open");
        content.style.maxHeight = "0";
        icon.classList.remove("rotate");
      }
    });
  });
  /* end faqs */

  /*  WIDGET WHATSAPP */

  const widgetButton = document.getElementById("widget-button");
  const widgetContainer = document.getElementById("widget-container");
  const closeButton = document.getElementById("close-widget");
  const form = document.getElementById("whatsapp-form");
  const nameInput = document.getElementById("name-input");
  const messageInput = document.getElementById("message-input");
  const predefinedButtons = document.querySelectorAll(".predefined-message");

  widgetButton.addEventListener("click", () => {
    if (
      !widgetContainer.classList.contains("hidden") ||
      widgetContainer.classList.contains("animate-open")
    )
      return;
    widgetContainer.classList.remove("hidden");
    widgetContainer.classList.add("animate-open");
    setTimeout(() => {
      widgetContainer.classList.remove("animate-open");
    }, 300);
  });

  closeButton.addEventListener("click", () => {
    widgetContainer.classList.add("animate-close");
    setTimeout(() => {
      widgetContainer.classList.add("hidden");
      widgetContainer.classList.remove("animate-close");
    }, 300);
  });

  document.addEventListener("click", (e) => {
    if (
      !widgetContainer.contains(e.target) &&
      !widgetButton.contains(e.target)
    ) {
      widgetContainer.classList.add("animate-close");
      setTimeout(() => {
        widgetContainer.classList.add("hidden");
        widgetContainer.classList.remove("animate-close");
      }, 300);
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value;
    const message = messageInput.value;
    const whatsappMessage = encodeURIComponent(`Hola, soy ${name}. ${message}`);
    const phoneNumber = "51930349034"; // Cambiar al número deseado
    window.open(
      `https://wa.me/${phoneNumber}?text=${whatsappMessage}`,
      "_blank"
    );
  });

  predefinedButtons.forEach((button) => {
    button.addEventListener("click", () => {
      messageInput.value = button.dataset.message;
    });
  });
  /* END WIDGET WHATSAPP */
});

/*  ANIMACIÓN DE NÚMEROS */
const counters = document.querySelectorAll(".counter");
const speed = 100;
const animateCounters = () => {
  counters.forEach((counter) => {
    const updateCount = () => {
      const target = +counter.getAttribute("data-target");
      const count = +counter.innerText;

      const increment = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(updateCount, 20);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });
};

const observer = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    });
  },
  { threshold: 0.5 }
);

counters.forEach((counter) => {
  observer.observe(counter);
});
/*  END ANIMACIÓN DE NÚMEROS */

/*  HERO */
const images = [
  "./assets/img/hero_1.jpg",
  "./assets/img/hero_2.jpg",
  "./assets/img/odontopediatra_texto.jpg",
];

let currentIndex = 0;
const dynamicImage = document.getElementById("dynamicImage");

setInterval(() => {
  dynamicImage.classList.add("opacity-0");

  setTimeout(() => {
    currentIndex = (currentIndex + 1) % images.length;
    dynamicImage.src = images[currentIndex];

    dynamicImage.classList.remove("opacity-0");
    dynamicImage.classList.add("opacity-100");
  }, 1000);
}, 3000);

/* END HERO */

const testimonios = [
  {
    imagen: "./assets/img/profile/ana_maria.jpg",
    frase:
      "Mi experiencia fue excelente, los doctores son muy profesionales y me hicieron sentir tranquila durante todo el proceso. Los resultados han sido sorprendentes, ¡me encanta mi nueva sonrisa!",
    nombre: "- Anna María",
  },
  {
    imagen: "./assets/img/profile/gabriela_paredes.jpg",
    frase:
      "Fui por una consulta y quedé tan satisfecha con la atención que decidí continuar con varios tratamientos. Los resultados fueron más allá de lo esperado. Muy recomendados!",
    nombre: "- Gabriela Paredes",
  },
  {
    imagen: "./assets/img/profile/dianita.jpg",
    frase:
      "Mi hija tenía mucho miedo al dentista, pero la odontopediatra de esta clínica hizo todo lo posible para que se sintiera cómoda. Ahora, ella disfruta ir a sus chequeos. ¡Una clínica increíble para mis pequeños!",
    nombre: "- Diana Mendoza",
  },
  // Puedes agregar más testimonios aquí
];

// Función para generar los elementos del carrusel
const renderCarouselItems = () => {
  const carouselItemsContainer = document.querySelector(".carousel-items");
  carouselItemsContainer.innerHTML = ""; // Limpiar el contenido previo

  testimonios.forEach((testimonio) => {
    const item = document.createElement("div");
    item.classList.add(
      "carousel-item",
      "w-full",
      "text-center",
      "flex-shrink-0"
    );
    item.innerHTML = `
    <span class="material-symbols--star"></span>
    <span class="material-symbols--star"></span>
    <span class="material-symbols--star"></span>
    <span class="material-symbols--star"></span>
      <p class="mx-auto max-w-4xl text-xl italic text-white md:text-xl">
        "${testimonio.frase}"
      </p>
      
      <div class="mb-6 mt-12 flex justify-center">
      
        <img src="${testimonio.imagen}" class="h-24 w-24 rounded-full shadow-lg dark:shadow-black/30" alt="Imagen de perfil" />
      </div>
      <p class="text-neutral-500 dark:text-neutral-300">${testimonio.nombre}</p>
    `;
    carouselItemsContainer.appendChild(item);
  });
};

// Llamada inicial para generar el carrusel
renderCarouselItems();

// Variables del carrusel
const carouselItems = document.querySelector(".carousel-items");
const items = document.querySelectorAll(".carousel-item");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
let currentdIndex = 0;

// Actualizar el carrusel
const updateCarousel = () => {
  const offset = -currentdIndex * 100;
  carouselItems.style.transform = `translateX(${offset}%)`;
};

// Mover al item anterior
prevBtn.addEventListener("click", () => {
  currentdIndex = currentdIndex > 0 ? currentdIndex - 1 : items.length - 1;
  updateCarousel();
});

// Mover al siguiente item
nextBtn.addEventListener("click", () => {
  currentdIndex = currentdIndex < items.length - 1 ? currentdIndex + 1 : 0;
  updateCarousel();
});

/* CARRUSEL DE IMÁGENES Y DESCRIPCION */

const carouselData = [
  {
    background: "./assets/img/bg/bg_1.jpg",
    image: "./assets/img/odontopediatra.jpg",
    subtitle: "Por una Nueva Sonrisa",
    title: "Tecnologías de Cuidado para Tu Salud",
    description:
      "Vive el poder transformador de la odontología moderna en <span class='font-bold'>Imagen Dental</span>. Nuestro equipo emplea las últimas tecnologías y tratamientos para mejorar tu sonrisa y aumentar tu confianza.",
  },
  {
    background: "./assets/img/bg/bg_1.jpg",
    image:
      "https://i.pinimg.com/736x/08/0d/06/080d0659ba389b929e80a397d0225b80.jpg",
    subtitle: "Confianza en tu Sonrisa",
    title: "Tratamientos Avanzados en Ortodoncia",
    description:
      "Corrige y alinea tus dientes con nuestros tratamientos de ortodoncia personalizados. <span class='font-bold'>Imagen Dental</span> está aquí para transformar tu sonrisa.",
  },
  {
    background: "./assets/img/bg/bg_1.jpg",
    image:
      "https://scontent.fcix1-1.fna.fbcdn.net/v/t39.30808-6/364207059_647391770854374_5975047899839191426_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeEEPYlq0CAFInnivvWyG0xO5j0Kt615M_fmPQq3rXkz9xYG9NqbZ6V685ILHvHzkb_etThe0zWJlOp6Tni-HRal&_nc_ohc=a5NNFwkgLpcQ7kNvgHJBMlL&_nc_oc=AdgDoCrkdOpItEDvJz19WM_LMWhNGszPIhKgcOOXnOfdseaOWh9bNBXFPL9q-ZncDOM&_nc_zt=23&_nc_ht=scontent.fcix1-1.fna&_nc_gid=AP9jyOr4CahDri4xSlNKQag&oh=00_AYA2VdKrsX2YRDEoHjn0EN9IsG7bMY4kNdwKjMpANrW6fw&oe=677D3DDD",
    subtitle: "Sonríe con Brillo",
    title: "Blanqueamiento Dental Seguro",
    description:
      "Haz que tu sonrisa brille más con nuestros tratamientos de blanqueamiento dental. En <span class='font-bold'>Imagen Dental</span>, tu seguridad y resultados son nuestra prioridad.",
  },
];

let sacurrentIndex = 0;

function saupdateCarousel() {
  const carousel = document.getElementById("sacarousel");
  const image = document.getElementById("sacarousel-image");
  const subtitle = document.getElementById("sacarousel-subtitle");
  const title = document.getElementById("sacarousel-title");
  const description = document.getElementById("sacarousel-description");

  const {
    background,
    image: imgSrc,
    subtitle: sub,
    title: tit,
    description: desc,
  } = carouselData[sacurrentIndex];

  // Desactiva la opacidad para aplicar la transición
  image.style.opacity = 0;
  carousel.style.opacity = 0;

  setTimeout(() => {
    carousel.style.backgroundImage = `url('${background}')`;
    image.src = imgSrc;
    subtitle.textContent = sub;
    title.textContent = tit;
    description.innerHTML = desc;
    carousel.style.opacity = 1;
    // Reactiva la opacidad para que la transición se aplique
    image.style.opacity = 1;
  }, 500); // El tiempo coincide con la transición

  sacurrentIndex = (sacurrentIndex + 1) % carouselData.length;
}

// Cambia cada 5 segundos
setInterval(saupdateCarousel, 5000);

/* doctores o ofertas!! */
var swiper = new Swiper(".multiple-slide-carousel", {
  loop: true,
  slidesPerView: 3,
  spaceBetween: 20,
  navigation: {
    nextEl: ".multiple-slide-carousel .swiper-button-next",
    prevEl: ".multiple-slide-carousel .swiper-button-prev",
  },
  breakpoints: {
    1920: {
      slidesPerView: 3,
      spaceBetween: 30,
    },
    1028: {
      slidesPerView: 2,
      spaceBetween: 30,
    },
    990: {
      slidesPerView: 1,
      spaceBetween: 0,
    },
  },
});
