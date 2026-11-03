const adminKeys = {
    products: "impresi-products",
    orders: "impresi-orders",
    reviews: "impresi-reviews"
};
const categoryNames = {
    hogar: "Hogar",
    escritorio: "Escritorio",
    accesorios: "Accesorios",
    personalizados: "Personalizados"
};
const orderStatuses = ["Pendiente", "En preparación", "Enviado", "Entregado", "Cancelado"];
const adminMessage = document.querySelector("#admin-message");
const productForm = document.querySelector("#product-form");
const orderForm = document.querySelector("#order-form");

function readAdminRecords(key) {
    const raw = localStorage.getItem(key);
    if (raw === null && key === adminKeys.products) return readProducts();
    const records = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(records)) throw new Error("El formato de los datos guardados no es válido.");
    if (key === adminKeys.reviews) {
        if (records.some((review) => !review || typeof review !== "object" || Array.isArray(review))) {
            throw new Error("Hay una opinión guardada con un formato no válido.");
        }
        const normalized = records.map((review) => ({
            ...review,
            id: review.id || createRecordId(),
            status: review.status || "approved"
        }));
        if (normalized.some((review, index) =>
            review.id !== records[index].id || review.status !== records[index].status
        )) writeAdminRecords(key, normalized);
        return normalized;
    }
    return records;
}

function writeAdminRecords(key, records) {
    localStorage.setItem(key, JSON.stringify(records));
}

function createRecordId() {
    return globalThis.crypto?.randomUUID?.() || `imp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function setAdminMessage(message, isError = false) {
    adminMessage.textContent = message;
    adminMessage.classList.toggle("error", isError);
}

function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function addActionButton(parent, text, action, recordId, className = "admin-action") {
    const button = makeElement("button", className, text);
    button.type = "button";
    button.dataset.action = action;
    button.dataset.id = recordId;
    parent.append(button);
    return button;
}

function formatPrice(value) {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}

function parsePrice(value) {
    return Number(String(value).replace(",", ".").replace(/[^\d.]/g, ""));
}

function renderProducts() {
    const products = readAdminRecords(adminKeys.products);
    const list = document.querySelector("#admin-products");
    const empty = document.querySelector("#products-empty");
    list.replaceChildren(...products.map((product) => {
        const row = makeElement("article", "admin-record");
        const details = makeElement("div", "admin-record-details");
        details.append(
            makeElement("strong", "", product.name),
            makeElement("span", "", `${categoryNames[product.category] || product.category} · ${formatPrice(parsePrice(product.price))}`)
        );
        const actions = makeElement("div", "admin-record-actions");
        addActionButton(actions, "Editar", "edit-product", product.id);
        addActionButton(actions, "Eliminar", "delete-product", product.id, "admin-action danger");
        row.append(details, actions);
        return row;
    }));
    empty.hidden = products.length > 0;
    document.querySelector("#product-count").textContent = String(products.length);
    document.querySelector("#product-list-summary").textContent = `${products.length} producto${products.length === 1 ? "" : "s"}`;
}

function renderOrders() {
    const orders = readAdminRecords(adminKeys.orders);
    const list = document.querySelector("#admin-orders");
    const empty = document.querySelector("#orders-empty");
    list.replaceChildren(...orders.map((order) => {
        const row = makeElement("article", "admin-record order-record");
        const details = makeElement("div", "admin-record-details");
        details.append(
            makeElement("strong", "", order.item),
            makeElement("span", "", `${order.customer} · ${formatPrice(Number(order.total))} · ${order.date}`)
        );
        const controls = makeElement("div", "admin-record-actions");
        const status = document.createElement("select");
        status.className = "status-select";
        status.setAttribute("aria-label", `Estado del pedido de ${order.customer}`);
        orderStatuses.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            option.selected = value === order.status;
            status.append(option);
        });
        status.dataset.action = "update-order";
        status.dataset.id = order.id;
        controls.append(status);
        addActionButton(controls, "Eliminar", "delete-order", order.id, "admin-action danger");
        row.append(details, controls);
        return row;
    }));
    empty.hidden = orders.length > 0;
    document.querySelector("#order-count").textContent = String(orders.length);
    document.querySelector("#order-list-summary").textContent = `${orders.length} pedido${orders.length === 1 ? "" : "s"}`;
}

function renderReviews() {
    const reviews = readAdminRecords(adminKeys.reviews);
    const list = document.querySelector("#admin-reviews");
    const empty = document.querySelector("#reviews-empty");
    list.replaceChildren(...reviews.map((review) => {
        const row = makeElement("article", "admin-record review-record");
        const details = makeElement("div", "admin-record-details");
        const title = makeElement("strong", "", `${review.name} · ${review.rating}/5`);
        const category = makeElement("span", "review-category", review.category);
        const text = makeElement("p", "admin-review-text", review.text);
        const state = review.status === "approved" ? "Publicada" : "Pendiente";
        details.append(title, category, text, makeElement("span", "admin-record-meta", `${state} · ${review.date}`));
        const actions = makeElement("div", "admin-record-actions");
        if (review.status !== "approved") {
            addActionButton(actions, "Aprobar", "approve-review", review.id, "admin-action approve");
        } else {
            addActionButton(actions, "Retirar", "unpublish-review", review.id);
        }
        addActionButton(actions, "Eliminar", "delete-review", review.id, "admin-action danger");
        row.append(details, actions);
        return row;
    }));
    empty.hidden = reviews.length > 0;
    const pending = reviews.filter((review) => review.status !== "approved").length;
    document.querySelector("#review-count").textContent = String(pending);
    document.querySelector("#review-list-summary").textContent =
        `${reviews.length} opinión${reviews.length === 1 ? "" : "es"} · ${pending} pendiente${pending === 1 ? "" : "s"}`;
}

function refreshAdmin() {
    try {
        renderProducts();
        renderOrders();
        renderReviews();
    } catch (error) {
        console.error("No se pudieron cargar los datos de administración.", error);
        setAdminMessage("No se pudieron cargar los datos guardados. Comprueba el almacenamiento de este navegador.", true);
    }
}

function clearProductForm() {
    productForm.reset();
    productForm.elements.id.value = "";
    document.querySelector("#product-form-title").textContent = "Añadir producto";
    document.querySelector("#product-save").textContent = "Añadir producto";
    document.querySelector("#product-cancel").hidden = true;
}

document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".admin-tab").forEach((item) => {
            const selected = item === tab;
            item.classList.toggle("active", selected);
            item.setAttribute("aria-selected", String(selected));
        });
        document.querySelectorAll(".admin-panel").forEach((panel) => {
            const selected = panel.id === `panel-${tab.dataset.panel}`;
            panel.classList.toggle("active", selected);
            panel.hidden = !selected;
        });
        setAdminMessage("");
    });
});

productForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(productForm);
    const name = String(data.get("name")).trim();
    const description = String(data.get("description")).trim();
    const priceValue = Number(data.get("price"));
    if (!name || !description || !Number.isFinite(priceValue) || priceValue <= 0) {
        setAdminMessage("Revisa el nombre, la descripción y el precio del producto.", true);
        return;
    }
    try {
        const products = readAdminRecords(adminKeys.products);
        const id = String(data.get("id"));
        const product = {
            id: id || createRecordId(),
            name,
            category: String(data.get("category")),
            label: categoryNames[String(data.get("category"))],
            description,
            price: formatPrice(priceValue),
            symbol: "◇"
        };
        const index = products.findIndex((item) => item.id === id);
        if (index >= 0) products[index] = { ...products[index], ...product, sample: false };
        else products.unshift(product);
        writeAdminRecords(adminKeys.products, products);
        clearProductForm();
        renderProducts();
        setAdminMessage(index >= 0 ? "Producto actualizado." : "Producto añadido a la tienda.");
    } catch (error) {
        console.error("No se pudo guardar el producto.", error);
        setAdminMessage("No se pudo guardar el producto. Comprueba el almacenamiento del navegador.", true);
    }
});

document.querySelector("#product-cancel").addEventListener("click", clearProductForm);

document.querySelector("#admin-products").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    try {
        const products = readAdminRecords(adminKeys.products);
        const product = products.find((item) => item.id === button.dataset.id);
        if (!product) {
            setAdminMessage("No se encontró el producto seleccionado.", true);
            return;
        }
        if (button.dataset.action === "edit-product") {
            productForm.elements.id.value = product.id;
            productForm.elements.name.value = product.name;
            productForm.elements.category.value = product.category;
            productForm.elements.description.value = product.description;
            productForm.elements.price.value = parsePrice(product.price);
            document.querySelector("#product-form-title").textContent = "Editar producto";
            document.querySelector("#product-save").textContent = "Guardar cambios";
            document.querySelector("#product-cancel").hidden = false;
            productForm.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (button.dataset.action === "delete-product" && window.confirm(`¿Eliminar «${product.name}» de la tienda?`)) {
            writeAdminRecords(adminKeys.products, products.filter((item) => item.id !== product.id));
            renderProducts();
            setAdminMessage("Producto eliminado.");
        }
    } catch (error) {
        console.error("No se pudo actualizar el producto.", error);
        setAdminMessage("No se pudo actualizar el producto. Comprueba el almacenamiento del navegador.", true);
    }
});

orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(orderForm);
    const customer = String(data.get("customer")).trim();
    const item = String(data.get("item")).trim();
    const total = Number(data.get("total"));
    if (!customer || !item || !Number.isFinite(total) || total <= 0) {
        setAdminMessage("Revisa los datos del pedido y el importe.", true);
        return;
    }
    try {
        const orders = readAdminRecords(adminKeys.orders);
        orders.unshift({
            id: createRecordId(),
            customer,
            item,
            total,
            status: String(data.get("status")),
            date: new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date())
        });
        writeAdminRecords(adminKeys.orders, orders);
        orderForm.reset();
        renderOrders();
        setAdminMessage("Pedido registrado.");
    } catch (error) {
        console.error("No se pudo guardar el pedido.", error);
        setAdminMessage("No se pudo guardar el pedido. Comprueba el almacenamiento del navegador.", true);
    }
});

document.querySelector("#admin-orders").addEventListener("change", (event) => {
    const select = event.target.closest('select[data-action="update-order"]');
    if (!select) return;
    try {
        const orders = readAdminRecords(adminKeys.orders);
        const order = orders.find((item) => item.id === select.dataset.id);
        if (!order) throw new Error("No se encontró el pedido seleccionado.");
        order.status = select.value;
        writeAdminRecords(adminKeys.orders, orders);
        renderOrders();
        setAdminMessage("Estado del pedido actualizado.");
    } catch (error) {
        console.error("No se pudo actualizar el pedido.", error);
        setAdminMessage("No se pudo actualizar el pedido. Comprueba el almacenamiento del navegador.", true);
    }
});

document.querySelector("#admin-orders").addEventListener("click", (event) => {
    const button = event.target.closest('button[data-action="delete-order"]');
    if (!button || !window.confirm("¿Eliminar este pedido?")) return;
    try {
        const orders = readAdminRecords(adminKeys.orders);
        writeAdminRecords(adminKeys.orders, orders.filter((item) => item.id !== button.dataset.id));
        renderOrders();
        setAdminMessage("Pedido eliminado.");
    } catch (error) {
        console.error("No se pudo eliminar el pedido.", error);
        setAdminMessage("No se pudo eliminar el pedido. Comprueba el almacenamiento del navegador.", true);
    }
});

document.querySelector("#admin-reviews").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    try {
        const reviews = readAdminRecords(adminKeys.reviews);
        const review = reviews.find((item) => item.id === button.dataset.id);
        if (!review) {
            setAdminMessage("No se encontró la opinión seleccionada.", true);
            return;
        }
        if (button.dataset.action === "delete-review") {
            if (!window.confirm("¿Eliminar esta opinión definitivamente?")) return;
            writeAdminRecords(adminKeys.reviews, reviews.filter((item) => item.id !== review.id));
            setAdminMessage("Opinión eliminada.");
        } else {
            review.status = button.dataset.action === "approve-review" ? "approved" : "pending";
            writeAdminRecords(adminKeys.reviews, reviews);
            setAdminMessage(review.status === "approved" ? "Opinión publicada." : "Opinión retirada de la página pública.");
        }
        renderReviews();
    } catch (error) {
        console.error("No se pudo moderar la opinión.", error);
        setAdminMessage("No se pudo actualizar la opinión. Comprueba el almacenamiento del navegador.", true);
    }
});

window.addEventListener("storage", (event) => {
    if (Object.values(adminKeys).includes(event.key)) refreshAdmin();
});

refreshAdmin();
