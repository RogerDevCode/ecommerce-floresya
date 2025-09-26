
function assignImagesToProducts(productIds, imageNames) {
  // Mezclamos aleatoriamente las imágenes
  let shuffledImages = [...imageNames];
  shuffleArray(shuffledImages);

  // Inicializamos la estructura de asignación
  const assignments = {};
  productIds.forEach(id => {
    assignments[id] = [];
  });

  // Paso 1: Asignar una imagen a cada producto (asegurar al menos 1 por producto)
  for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    const image = shuffledImages.pop(); // Sacamos una imagen del array
    if (image !== undefined) {
      // Añadimos la imagen completa (con sus 4 variaciones) con display_order = 1
      assignments[productId].push({
        ...image,
        display_order: 1
      });
    }
  }

  // Paso 2: Asignar imágenes restantes aleatoriamente
  while (shuffledImages.length > 0) {
    const image = shuffledImages.pop();
    if (image === undefined) break;

    // Seleccionar aleatoriamente un producto que tenga menos de 4 imágenes
    const availableProducts = productIds.filter(id => assignments[id].length < 4);
    if (availableProducts.length === 0) {
      // Si no hay productos disponibles, salir (esto no debería pasar si nimg >= nprod)
      break;
    }

    const randomProductId = availableProducts[Math.floor(Math.random() * availableProducts.length)];
    const currentOrder = assignments[randomProductId].length + 1; // Calcular siguiente display_order

    // Añadimos la imagen completa con el siguiente display_order
    assignments[randomProductId].push({
      ...image,
      display_order: currentOrder
    });
  }

  return assignments;
}

// Función para mezclar un array aleatoriamente (Fisher-Yates shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Ejemplo de uso
const productIds = [1, 2, 3]; // 3 productos
const imageNames = [
  { large: "1_01_large.jpg", medium: "1_01_medium.jpg", small: "1_01_small.jpg", thumb: "1_01_thumb.jpg" },
  { large: "2_02_large.jpg", medium: "2_02_medium.jpg", small: "2_02_small.jpg", thumb: "2_02_thumb.jpg" },
  { large: "3_03_large.jpg", medium: "3_03_medium.jpg", small: "3_03_small.jpg", thumb: "3_03_thumb.jpg" },
  { large: "4_04_large.jpg", medium: "4_04_medium.jpg", small: "4_04_small.jpg", thumb: "4_04_thumb.jpg" },
  { large: "5_05_large.jpg", medium: "5_05_medium.jpg", small: "5_05_small.jpg", thumb: "5_05_thumb.jpg" },
  { large: "6_06_large.jpg", medium: "6_06_medium.jpg", small: "6_06_small.jpg", thumb: "6_06_thumb.jpg" }
]; // 6 imágenes base

const result = assignImagesToProducts(productIds, imageNames);
console.log(result);
