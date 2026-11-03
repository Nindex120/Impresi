const defaultProducts = [
    { name: "Maceta geométrica", category: "hogar", label: "Hogar", description: "Un toque moderno para tus plantas favoritas.", price: "12,00 €", symbol: "⌂" },
    { name: "Soporte para móvil", category: "escritorio", label: "Escritorio", description: "Tu pantalla siempre a la vista y bien apoyada.", price: "8,00 €", symbol: "▯" },
    { name: "Llavero personalizado", category: "personalizados", label: "Personalizados", description: "Un detalle único con el diseño que tú elijas.", price: "5,00 €", symbol: "⌑" },
    { name: "Organizador de cables", category: "escritorio", label: "Escritorio", description: "Dile adiós a los cables enredados en tu mesa.", price: "6,00 €", symbol: "⌁" },
    { name: "Soporte para auriculares", category: "escritorio", label: "Escritorio", description: "Mantén tus auriculares a mano y ordenados.", price: "14,00 €", symbol: "⌒" },
    { name: "Maceta mini", category: "hogar", label: "Hogar", description: "Una pequeña pieza para darle vida a tu espacio.", price: "7,00 €", symbol: "♧" },
    { name: "Colgador de pared", category: "hogar", label: "Hogar", description: "Una solución práctica con un diseño sencillo.", price: "9,00 €", symbol: "⌑" },
    { name: "Llavero con inicial", category: "personalizados", label: "Personalizados", description: "Añade una inicial y elige tu combinación de color.", price: "6,00 €", symbol: "✳" },
    { name: "Organizador de escritorio", category: "escritorio", label: "Escritorio", description: "Un lugar para los pequeños objetos de cada día.", price: "11,00 €", symbol: "▤" },
    { name: "Adorno minimalista", category: "hogar", label: "Hogar", description: "Una pieza decorativa de líneas limpias.", price: "10,00 €", symbol: "◇" },
    { name: "Soporte para mando", category: "accesorios", label: "Accesorios", description: "Guarda tu mando de juego de forma ordenada.", price: "9,00 €", symbol: "⌘" },
    { name: "Clip multiuso", category: "accesorios", label: "Accesorios", description: "Pequeño, útil y preparado para el día a día.", price: "4,00 €", symbol: "⌁" }
].map((product, index) => ({ ...product, id: `muestra-${index + 1}`, sample: true }));

const productStorageKey = "impresi-products";
const reviewStorageKey = "impresi-reviews";

function readStoredArray(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return fallback;
        const value = JSON.parse(stored);
        return Array.isArray(value) ? value : fallback;
    } catch (error) {
        console.error(`No se pudieron cargar los datos de ${key}.`, error);
        return fallback;
    }
}

function readProducts() {
    return readStoredArray(productStorageKey, defaultProducts).filter((product) =>
        product && typeof product.name === "string" && typeof product.description === "string" &&
        typeof product.price === "string" && typeof product.category === "string" &&
        typeof product.id === "string"
    );
}

const productGrid = document.querySelector("#product-grid");
if (productGrid) {
    const searchInput = document.querySelector("#product-search");
    const categoryFilter = document.querySelector("#category-filter");
    const pagination = document.querySelector("#pagination");
    const emptyState = document.querySelector("#empty-products");
    const pageSize = 20;
    let currentPage = 1;

    function renderCatalog() {
        const query = searchInput.value.trim().toLocaleLowerCase("es");
        const category = categoryFilter.value;
        const matches = readProducts().filter((product) =>
            (category === "all" || product.category === category) &&
            `${product.name} ${product.label} ${product.description}`.toLocaleLowerCase("es").includes(query)
        );
        const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
        currentPage = Math.min(currentPage, pageCount);
        const visibleProducts = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        productGrid.replaceChildren(...visibleProducts.map((product) => {
            const card = document.createElement("article");
            card.className = "product-card";
            const art = document.createElement("div");
            art.className = "product-art";
            art.setAttribute("aria-hidden", "true");
            const symbol = document.createElement("span");
            symbol.className = "product-symbol";
            symbol.textContent = product.symbol;
            art.append(symbol);

            const info = document.createElement("div");
            info.className = "product-info";
            const label = document.createElement("span");
            label.className = "product-category";
            label.textContent = product.label;
            const name = document.createElement("h3");
            name.textContent = product.name;
            const description = document.createElement("p");
            description.textContent = product.description;
            const meta = document.createElement("div");
            meta.className = "product-meta";
            const price = document.createElement("span");
            price.className = "product-price";
            const numericPrice = Number(String(product.price).replace(",", ".").replace(/[^\d.]/g, ""));
            price.textContent = Number.isFinite(numericPrice)
                ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(numericPrice)
                : product.price;
            const note = document.createElement("span");
            note.className = "product-tag";
            note.textContent = product.sample ? "Precio de muestra" : "";
            note.hidden = !product.sample;
            meta.append(price, note);
            info.append(label, name, description, meta);
            card.append(art, info);
            return card;
        }));
        emptyState.hidden = matches.length > 0;
        pagination.replaceChildren(
            createPageButton("‹", currentPage - 1, currentPage === 1, "Página anterior")
        );
        const pageStatus = document.createElement("span");
        pageStatus.className = "pagination-status";
        pageStatus.textContent = `Página ${currentPage} de ${pageCount}`;
        pagination.append(pageStatus);
        if (pageCount > 1) {
            for (let page = 1; page <= pageCount; page += 1) {
                const button = createPageButton(String(page), page, false, `Página ${page}`);
                if (page === currentPage) button.setAttribute("aria-current", "page");
                pagination.append(button);
            }
        }
        pagination.append(createPageButton("›", currentPage + 1, currentPage === pageCount, "Página siguiente"));
    }

    function createPageButton(text, page, disabled, label) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.setAttribute("aria-label", label);
        button.disabled = disabled;
        button.addEventListener("click", () => {
            currentPage = page;
            renderCatalog();
        });
        return button;
    }

    searchInput.addEventListener("input", () => { currentPage = 1; renderCatalog(); });
    categoryFilter.addEventListener("change", () => { currentPage = 1; renderCatalog(); });
    renderCatalog();
    window.addEventListener("storage", (event) => {
        if (event.key === productStorageKey) renderCatalog();
    });
}

const reviewForm = document.querySelector("#review-form");
if (reviewForm) {
    const reviewList = document.querySelector("#review-list");
    const emptyReviews = document.querySelector("#empty-reviews");
    const reviewMessage = document.querySelector("#review-message");

    function readReviews() {
        return readStoredArray(reviewStorageKey, []).filter((review) =>
                review && typeof review.name === "string" && typeof review.text === "string" &&
                typeof review.category === "string" && Number.isInteger(review.rating) &&
                review.rating >= 1 && review.rating <= 5 && typeof review.date === "string" &&
                (review.status === "approved" || review.status === undefined)
            );
    }

    function renderReviews() {
        const reviews = readReviews();
        emptyReviews.hidden = reviews.length > 0;
        reviewList.replaceChildren(...reviews.map((review) => {
            const card = document.createElement("article");
            card.className = "review-card";
            const top = document.createElement("div");
            top.className = "review-card-top";
            const author = document.createElement("h3");
            author.textContent = review.name;
            const stars = document.createElement("span");
            stars.className = "review-stars";
            stars.setAttribute("aria-label", `${review.rating} de 5 estrellas`);
            stars.textContent = `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`;
            top.append(author, stars);
            const category = document.createElement("span");
            category.className = "review-category";
            category.textContent = review.category;
            const text = document.createElement("p");
            text.textContent = review.text;
            const date = document.createElement("span");
            date.className = "review-date";
            date.textContent = review.date;
            card.append(top, category, text, date);
            return card;
        }));
    }

    reviewForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(reviewForm);
        const review = {
            id: globalThis.crypto?.randomUUID?.() || `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: String(formData.get("name")).trim(),
            category: String(formData.get("category")),
            rating: Number(formData.get("rating")),
            text: String(formData.get("text")).trim(),
            status: "pending",
            date: new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date())
        };
        if (!review.name || !review.text || !review.category || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
            reviewMessage.textContent = "Revisa los campos e inténtalo de nuevo.";
            return;
        }
        try {
            const reviews = readStoredArray(reviewStorageKey, []);
            reviews.unshift(review);
            localStorage.setItem(reviewStorageKey, JSON.stringify(reviews));
            reviewMessage.textContent = "¡Gracias! Tu reseña está pendiente de revisión.";
            reviewForm.reset();
            renderReviews();
        } catch (error) {
            reviewMessage.textContent = "No se pudo guardar la reseña. Comprueba el almacenamiento de tu navegador.";
        }
    });

    renderReviews();
    window.addEventListener("storage", (event) => {
        if (event.key === reviewStorageKey) renderReviews();
    });
}

document.querySelectorAll("#current-year, .year").forEach((element) => {
    element.textContent = new Date().getFullYear();
});
