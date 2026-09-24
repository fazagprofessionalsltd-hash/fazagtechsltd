// Initial Application State & Data Structure
let currentUser = null;

// Initial Local Storage Setup if empty
if (!localStorage.getItem('fazag_users')) {
    const defaultUsers = [
        { username: 'admin', password: 'password12345', role: 'admin' }
    ];
    localStorage.setItem('fazag_users', JSON.stringify(defaultUsers));
}

if (!localStorage.getItem('fazag_products')) {
    const defaultProducts = [
        { id: 'p1', name: 'Premium Motor Spirit (PMS)', sku: 'PMS-01' },
        { id: 'p2', name: 'Automotive Gas Oil (AGO)', sku: 'AGO-02' }
    ];
    localStorage.setItem('fazag_products', JSON.stringify(defaultProducts));
}

if (!localStorage.getItem('fazag_ledger')) {
    localStorage.setItem('fazag_ledger', JSON.stringify([]));
}

// Load data into working memory variables
let users = JSON.parse(localStorage.getItem('fazag_users'));
let products = JSON.parse(localStorage.getItem('fazag_products'));
let ledger = JSON.parse(localStorage.getItem('fazag_ledger'));

// DOM Cache Elements
const loginContainer = document.getElementById('login-container');
const mainDashboard = document.getElementById('main-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const userDisplayName = document.getElementById('user-display-name');
const userRoleDisplay = document.getElementById('user-role-display');
const logoutBtn = document.getElementById('logout-btn');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Forms & Inputs
const txForm = document.getElementById('transaction-form');
const entryIdInput = document.getElementById('entry-id');
const txDate = document.getElementById('tx-date');
const txParty = document.getElementById('tx-party');
const txInv = document.getElementById('tx-inv');
const txProduct = document.getElementById('tx-product');
const txDesc = document.getElementById('tx-desc');
const txQty = document.getElementById('tx-qty');
const txPrice = document.getElementById('tx-price');
const txAmount = document.getElementById('tx-amount');
const txType = document.getElementById('tx-type');
const submitTxBtn = document.getElementById('submit-tx-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formTitle = document.getElementById('form-title');

// Product Form
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const prodName = document.getElementById('prod-name');
const prodSku = document.getElementById('prod-sku');
const submitProdBtn = document.getElementById('submit-prod-btn');
const cancelProdEdit = document.getElementById('cancel-prod-edit');
const productFormTitle = document.getElementById('product-form-title');
const productListBody = document.getElementById('product-list-body');

// Staff Form
const staffForm = document.getElementById('staff-form');
const staffUsernameInput = document.getElementById('staff-username');
const staffPasswordInput = document.getElementById('staff-password');
const staffListBody = document.getElementById('staff-list-body');

// Filters & Tables
const filterProduct = document.getElementById('filter-product');
const filterSupplier = document.getElementById('filter-supplier');
const filterMonth = document.getElementById('filter-month');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const exportExcelBtn = document.getElementById('export-excel-btn');

const ledgerBody = document.getElementById('ledger-body');
const totalQtyEl = document.getElementById('total-qty');
const totalAmountEl = document.getElementById('total-amount');

// Authentication Controllers
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const uName = document.getElementById('username').value.trim();
    const pWord = document.getElementById('password').value;

    const user = users.find(u => u.username === uName && u.password === pWord);
    if (user) {
        currentUser = user;
        loginError.classList.add('hidden');
        loginForm.reset();
        initDashboard();
    } else {
        loginError.classList.remove('hidden');
    }
});

logoutBtn.addEventListener('logout', logout);
logoutBtn.onclick = logout;

function logout() {
    currentUser = null;
    mainDashboard.classList.add('hidden');
    loginContainer.classList.remove('hidden');
}

function initDashboard() {
    loginContainer.classList.add('hidden');
    mainDashboard.classList.remove('hidden');
    
    userDisplayName.textContent = `Welcome, ${currentUser.username}`;
    userRoleDisplay.textContent = currentUser.role.toUpperCase();

    // Adjust UI depending on role
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    } else {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
        // If current tab was admin, switch to inventory
        switchTab('inventory-section');
    }

    populateProductDropdowns();
    renderLedger();
    renderProducts();
    renderStaff();
}

// Navigation Tab Management
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        switchTab(target);
    });
});

function switchTab(targetId) {
    tabButtons.forEach(b => {
        if(b.getAttribute('data-target') === targetId) b.classList.add('active');
        else b.classList.remove('active');
    });

    tabContents.forEach(content => {
        if (content.id === targetId) content.classList.add('active');
        else content.classList.remove('active');
    });
}

// Form Math Logic (Auto-calculation)
function calcAmount() {
    const qty = parseFloat(txQty.value) || 0;
    const price = parseFloat(txPrice.value) || 0;
    txAmount.value = (qty * price).toFixed(2);
}
txQty.addEventListener('input', calcAmount);
txPrice.addEventListener('input', calcAmount);

// Product options population
function populateProductDropdowns() {
    // Inventory entry dropdown
    txProduct.innerHTML = '<option value="">-- Choose Product --</option>';
    // Filter dropdown
    filterProduct.innerHTML = '<option value="">All Products</option>';

    products.forEach(p => {
        const opt1 = document.createElement('option');
        opt1.value = p.id;
        opt1.textContent = `${p.name} (${p.sku})`;
        txProduct.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = p.id;
        opt2.textContent = p.name;
        filterProduct.appendChild(opt2);
    });
}

// Structural custom timestamp generator
function getCustomTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hrs}:${mins}:${secs}`;
}

// CRUD: Transaction Submissions
txForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = entryIdInput.value;
    const dateVal = txDate.value;
    const partyVal = txParty.value.trim();
    const invVal = txInv.value.trim();
    const prodIdVal = txProduct.value;
    const descVal = txDesc.value.trim();
    const qtyVal = parseInt(txQty.value);
    const priceVal = parseFloat(txPrice.value);
    const amountVal = parseFloat(txAmount.value);
    const typeVal = txType.value;

    if (!id) {
        // Create mode
        const newEntry = {
            id: 'tx_' + Date.now(),
            date: dateVal,
            operator: currentUser.username,
            timestamp: getCustomTimestamp(),
            party: partyVal,
            invNo: invVal,
            productId: prodIdVal,
            description: descVal,
            qty: qtyVal,
            price: priceVal,
            amount: amountVal,
            type: typeVal
        };
        ledger.push(newEntry);
    } else {
        // Edit mode (Admin privilege verified implicitly via UI constraints)
        if (currentUser.role !== 'admin') {
            alert('Unauthorized action!');
            return;
        }
        const index = ledger.findIndex(item => item.id === id);
        if (index !== -1) {
            ledger[index].date = dateVal;
            ledger[index].party = partyVal;
            ledger[index].invNo = invVal;
            ledger[index].productId = prodIdVal;
            ledger[index].description = descVal;
            ledger[index].qty = qtyVal;
            ledger[index].price = priceVal;
            ledger[index].amount = amountVal;
            ledger[index].type = typeVal;
            // Append audit update note
            ledger[index].operator = currentUser.username;
            ledger[index].timestamp = getCustomTimestamp() + ' (Edited)';
        }
    }

    localStorage.setItem('fazag_ledger', JSON.stringify(ledger));
    resetTxForm();
    renderLedger();
});

function resetTxForm() {
    txForm.reset();
    entryIdInput.value = '';
    formTitle.textContent = 'Record Transaction';
    submitTxBtn.textContent = 'Save Entry';
    submitTxBtn.className = 'btn btn-success';
    cancelEditBtn.classList.add('hidden');
}

cancelEditBtn.addEventListener('click', resetTxForm);

// Ledger Rendering with Filters & Computations
function renderLedger() {
    const fProd = filterProduct.value;
    const fSupplier = filterSupplier.value.toLowerCase().trim();
    const fMonth = filterMonth.value; // Format: YYYY-MM

    let filteredLedger = ledger.filter(item => {
        const matchesProd = !fProd || item.productId === fProd;
        const matchesSupplier = !fSupplier || item.party.toLowerCase().includes(fSupplier);
        const matchesMonth = !fMonth || item.date.startsWith(fMonth);
        return matchesProd && matchesSupplier && matchesMonth;
    });

    // Sort descending by operational execution/date context
    filteredLedger.sort((a,b) => new Date(b.date) - new Date(a.date));

    ledgerBody.innerHTML = '';
    let totalNetQty = 0;
    let totalNetAmt = 0;

    filteredLedger.forEach(item => {
        const prod = products.find(p => p.id === item.productId) || { name: 'Unknown', sku: 'N/A' };
        const isAdd = item.type === 'add';
        
        // Calculations for bottom net row
        if (isAdd) {
            totalNetQty += item.qty;
            totalNetAmt += item.amount;
        } else {
            totalNetQty -= item.qty;
            totalNetAmt -= item.amount;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.date}</td>
            <td><strong>${item.operator}</strong></td>
            <td style="font-size:0.8rem; color:#666;">${item.timestamp}</td>
            <td>${item.party}</td>
            <td>${item.invNo}</td>
            <td>${prod.name} (${prod.sku})</td>
            <td>${item.description}</td>
            <td><span class="${isAdd ? 'type-add' : 'type-reduce'}">${isAdd ? 'Receive' : 'Dispense'}</span></td>
            <td>${item.qty}</td>
            <td>₦${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td>₦${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td class="actions-col">
                ${currentUser.role === 'admin' ? `
                    <div class="action-btn-group">
                        <button class="btn btn-primary btn-sm" onclick="editEntry('${item.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteEntry('${item.id}')">Delete</button>
                    </div>
                ` : '-'}
            </td>
        `;
        ledgerBody.appendChild(tr);
    });

    // Update totals footer row
    totalQtyEl.textContent = totalNetQty;
    totalAmountEl.textContent = (totalNetAmt >= 0 ? '' : '-') + '₦' + Math.abs(totalNetAmt).toLocaleString(undefined, {minimumFractionDigits: 2});

    // Handle view constraint elements hiding column if staff
    if (currentUser.role !== 'admin') {
        document.querySelectorAll('.actions-col').forEach(el => el.classList.add('hidden'));
    } else {
        document.querySelectorAll('.actions-col').forEach(el => el.classList.remove('hidden'));
    }
}

// Global scope bindings for dynamic HTML table button triggers
window.editEntry = function(id) {
    const item = ledger.find(i => i.id === id);
    if (!item) return;

    formTitle.textContent = 'Modify Record Entry';
    entryIdInput.value = item.id;
    txDate.value = item.date;
    txParty.value = item.party;
    txInv.value = item.invNo;
    txProduct.value = item.productId;
    txDesc.value = item.description;
    txQty.value = item.qty;
    txPrice.value = item.price;
    txAmount.value = item.amount;
    txType.value = item.type;

    submitTxBtn.textContent = 'Update Record';
    submitTxBtn.className = 'btn btn-primary';
    cancelEditBtn.classList.remove('hidden');
    switchTab('inventory-section');
};

window.deleteEntry = function(id) {
    if (confirm('Are you completely sure you want to drop this transaction record permanently?')) {
        ledger = ledger.filter(i => i.id !== id);
        localStorage.setItem('fazag_ledger', JSON.stringify(ledger));
        renderLedger();
    }
};

// Realtime Filter Inputs Event Listeners
filterProduct.addEventListener('change', renderLedger);
filterSupplier.addEventListener('input', renderLedger);
filterMonth.addEventListener('change', renderLedger);
clearFiltersBtn.addEventListener('click', () => {
    filterProduct.value = '';
    filterSupplier.value = '';
    filterMonth.value = '';
    renderLedger();
});

// Product Operations CRUD
productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = productIdInput.value;
    const nameVal = prodName.value.trim();
    const skuVal = prodSku.value.toUpperCase().trim();

    if (!id) {
        // Creation
        const newProduct = {
            id: 'prod_' + Date.now(),
            name: nameVal,
            sku: skuVal
        };
        products.push(newProduct);
    } else {
        // Management modifications
        if (currentUser.role !== 'admin') {
            alert('Unauthorized privilege configuration.');
            return;
        }
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
            products[idx].name = nameVal;
            products[idx].sku = skuVal;
        }
    }

    localStorage.setItem('fazag_products', JSON.stringify(products));
    resetProductForm();
    populateProductDropdowns();
    renderProducts();
    renderLedger();
});

function resetProductForm() {
    productForm.reset();
    productIdInput.value = '';
    productFormTitle.textContent = 'Add New Product';
    submitProdBtn.textContent = 'Add Product';
    cancelProdEdit.classList.add('hidden');
}

cancelProdEdit.addEventListener('click', resetProductForm);

function renderProducts() {
    productListBody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.sku}</strong></td>
            <td>${p.name}</td>
            <td class="actions-col-prod">
                ${currentUser.role === 'admin' ? `
                    <div class="action-btn-group">
                        <button class="btn btn-primary btn-sm" onclick="editProduct('${p.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
                    </div>
                ` : '-'}
            </td>
        `;
        productListBody.appendChild(tr);
    });

    if (currentUser.role !== 'admin') {
        document.querySelectorAll('.actions-col-prod').forEach(el => el.classList.add('hidden'));
    } else {
        document.querySelectorAll('.actions-col-prod').forEach(el => el.classList.remove('hidden'));
    }
}

window.editProduct = function(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    productFormTitle.textContent = 'Edit Product Structure';
    productIdInput.value = p.id;
    prodName.value = p.name;
    prodSku.value = p.sku;
    submitProdBtn.textContent = 'Update Product';
    cancelProdEdit.classList.remove('hidden');
};

window.deleteProduct = function(id) {
    // Safe check if any transaction bounds to this item
    const linked = ledger.some(item => item.productId === id);
    if (linked) {
        alert('Cannot remove item! Active operational logs are linked directly to this product reference.');
        return;
    }
    if (confirm('Delete this product catalog item profile completely?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('fazag_products', JSON.stringify(products));
        populateProductDropdowns();
        renderProducts();
    }
};

// Staff Account Actions (Admin Control Block)
staffForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const uName = staffUsernameInput.value.trim().toLowerCase();
    const pWord = staffPasswordInput.value;

    if (users.some(u => u.username === uName)) {
        alert('This identity account username already exists.');
        return;
    }

    users.push({ username: uName, password: pWord, role: 'staff' });
    localStorage.setItem('fazag_users', JSON.stringify(users));
    staffForm.reset();
    renderStaff();
});

function renderStaff() {
    staffListBody.innerHTML = '';
    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.username}</td>
            <td><span class="type-add" style="background:#e0f2fe; color:#0369a1;">${u.role.toUpperCase()}</span></td>
            <td>
                ${u.username === 'admin' ? '<em>System Primary</em>' : `
                    <button class="btn btn-danger btn-sm" onclick="removeStaff('${u.username}')">Remove Access</button>
                `}
            </td>
        `;
        staffListBody.appendChild(tr);
    });
}

window.removeStaff = function(username) {
    if (confirm(`Revoke completely all administrative access profiles for user: ${username}?`)) {
        users = users.filter(u => u.username !== username);
        localStorage.setItem('fazag_users', JSON.stringify(users));
        renderStaff();
    }
};

// Export to Microsoft Excel Engine Implementation via Base64 CSV Stream Parsing
exportExcelBtn.addEventListener('click', () => {
    const fProd = filterProduct.value;
    const fSupplier = filterSupplier.value.toLowerCase().trim();
    const fMonth = filterMonth.value;

    let filtered = ledger.filter(item => {
        const matchesProd = !fProd || item.productId === fProd;
        const matchesSupplier = !fSupplier || item.party.toLowerCase().includes(fSupplier);
        const matchesMonth = !fMonth || item.date.startsWith(fMonth);
        return matchesProd && matchesSupplier && matchesMonth;
    });

    if (filtered.length === 0) {
        alert('No datasets are fetched inside active filtration buffers to run download streams.');
        return;
    }

    // Creating structured CSV lines
    let csvContent = "Date,Operator Log,Timestamp,Supplier_Customer Name,Invoice Number,Product Profile,Description,Transaction Type,Quantity,Price (NGN),Total Calculated Amount (NGN)\r\n";
    
    let netQ = 0;
    let netA = 0;

    filtered.forEach(item => {
        const prod = products.find(p => p.id === item.productId) || { name: 'Unknown', sku: 'N/A' };
        const typeStr = item.type === 'add' ? 'Receive Stock' : 'Dispense Stock';
        
        if (item.type === 'add') {
            netQ += item.qty;
            netA += item.amount;
        } else {
            netQ -= item.qty;
            netA -= item.amount;
        }

        // Clean values to avoid CSV parsing corruption
        const cleanParty = item.party.replace(/,/g, ' ');
        const cleanDesc = item.description.replace(/,/g, ' ');
        const cleanProd = `${prod.name} (${prod.sku})`.replace(/,/g, ' ');

        csvContent += `${item.date},${item.operator},${item.timestamp},${cleanParty},${item.invNo},${cleanProd},${cleanDesc},${typeStr},${item.qty},${item.price},${item.amount}\r\n`;
    });

    csvContent += `\r\nNet Totals,,,,,,,${netQ},,${netA}\r\n`;

    // Download stream setup using UTF-8 BOM encoding for seamless Microsoft Excel loading configurations
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Fazag_Global_Inventory_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
