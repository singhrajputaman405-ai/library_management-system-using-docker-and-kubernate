// DOM elements
const tabs = document.querySelectorAll('.tab-button');
const booksTab = document.getElementById('books-tab');
const membersTab = document.getElementById('members-tab');
const borrowingsTab = document.getElementById('borrowings-tab');
const booksList = document.getElementById('booksList');
const membersList = document.getElementById('membersList');
const borrowingsList = document.getElementById('borrowingsList');
const addBookBtn = document.getElementById('addBookBtn');
const addMemberBtn = document.getElementById('addMemberBtn');
const bookModal = document.getElementById('bookModal');
const memberModal = document.getElementById('memberModal');
const borrowModal = document.getElementById('borrowModal');
const closeBtns = document.querySelectorAll('.close');
const bookForm = document.getElementById('bookForm');
const memberForm = document.getElementById('memberForm');
const borrowForm = document.getElementById('borrowForm');
const memberSelect = document.getElementById('memberSelect');

// API base
const API_BOOKS = '/api/books';
const API_MEMBERS = '/api/members';
const API_BORROWS = '/api/borrows';

// Tab switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        
        if (tab.dataset.tab === 'books') loadBooks();
        if (tab.dataset.tab === 'members') loadMembers();
        if (tab.dataset.tab === 'borrowings') loadBorrowings();
    });
});

// Modal controls
function openBookModal(book = null) {
    document.getElementById('bookModalTitle').textContent = book ? 'Edit Book' : 'Add Book';
    document.getElementById('bookId').value = book?._id || '';
    document.getElementById('title').value = book?.title || '';
    document.getElementById('author').value = book?.author || '';
    document.getElementById('isbn').value = book?.isbn || '';
    document.getElementById('year').value = book?.year || '';
    document.getElementById('totalCopies').value = book?.totalCopies || 1;
    bookModal.style.display = 'block';
}

function openMemberModal(member = null) {
    document.getElementById('memberModalTitle').textContent = member ? 'Edit Member' : 'Add Member';
    document.getElementById('memberId').value = member?._id || '';
    document.getElementById('memberName').value = member?.name || '';
    document.getElementById('studentId').value = member?.studentId || '';
    document.getElementById('email').value = member?.email || '';
    document.getElementById('phone').value = member?.phone || '';
    memberModal.style.display = 'block';
}

async function openBorrowModal(bookId) {
    document.getElementById('borrowBookId').value = bookId;
    // Load members into select
    const members = await fetchMembers();
    memberSelect.innerHTML = '<option value="">Select a member</option>' + 
        members.map(m => `<option value="${m._id}">${m.name} (${m.studentId})</option>`).join('');
    
    // Set default due date to 2 weeks
    const date = new Date();
    date.setDate(date.getDate() + 14);
    document.getElementById('dueDate').value = date.toISOString().split('T')[0];
    borrowModal.style.display = 'block';
}

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        bookModal.style.display = 'none';
        memberModal.style.display = 'none';
        borrowModal.style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target === bookModal) bookModal.style.display = 'none';
    if (e.target === memberModal) memberModal.style.display = 'none';
    if (e.target === borrowModal) borrowModal.style.display = 'none';
});

// API helpers
async function fetchBooks() {
    const res = await fetch(API_BOOKS);
    return await res.json();
}

async function fetchMembers() {
    const res = await fetch(API_MEMBERS);
    return await res.json();
}

async function fetchBorrowings() {
    const res = await fetch(API_BORROWS);
    return await res.json();
}

// Load and render books
async function loadBooks() {
    const books = await fetchBooks();
    renderBooks(books);
}

function renderBooks(books) {
    if (!books.length) {
        booksList.innerHTML = '<p>No books. Add one!</p>';
        return;
    }
    booksList.innerHTML = books.map(book => `
        <div class="card" data-id="${book._id}">
            <h3>${escapeHtml(book.title)}</h3>
            <div class="author">by ${escapeHtml(book.author)}</div>
            <div class="details">
                ${book.isbn ? `ISBN: ${escapeHtml(book.isbn)}<br>` : ''}
                ${book.year ? `Year: ${book.year}` : ''}
            </div>
            <div class="copies">
                <span>Total: ${book.totalCopies}</span>
                <span>Available: ${book.availableCopies}</span>
            </div>
            <div class="card-actions">
                <button class="btn warning edit-book" data-id="${book._id}">✏️ Edit</button>
                <button class="btn danger delete-book" data-id="${book._id}">🗑️ Delete</button>
                <button class="btn success borrow-book" data-id="${book._id}" ${book.availableCopies <= 0 ? 'disabled' : ''}>
                    📖 Borrow
                </button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.edit-book').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const book = (await fetchBooks()).find(b => b._id === id);
            openBookModal(book);
        });
    });

    document.querySelectorAll('.delete-book').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Delete this book?')) return;
            const id = e.target.dataset.id;
            await fetch(`${API_BOOKS}/${id}`, { method: 'DELETE' });
            loadBooks();
            if (borrowingsTab.classList.contains('active')) loadBorrowings();
        });
    });

    document.querySelectorAll('.borrow-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            openBorrowModal(id);
        });
    });
}

// Load and render members
async function loadMembers() {
    const members = await fetchMembers();
    renderMembers(members);
}

function renderMembers(members) {
    if (!members.length) {
        membersList.innerHTML = '<p>No members. Add one!</p>';
        return;
    }
    membersList.innerHTML = members.map(member => `
        <div class="card" data-id="${member._id}">
            <h3>${escapeHtml(member.name)}</h3>
            <div class="details">
                Student ID: ${escapeHtml(member.studentId)}<br>
                ${member.email ? `Email: ${escapeHtml(member.email)}<br>` : ''}
                ${member.phone ? `Phone: ${escapeHtml(member.phone)}` : ''}
            </div>
            <div class="card-actions">
                <button class="btn warning edit-member" data-id="${member._id}">✏️ Edit</button>
                <button class="btn danger delete-member" data-id="${member._id}">🗑️ Delete</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.edit-member').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const member = (await fetchMembers()).find(m => m._id === id);
            openMemberModal(member);
        });
    });

    document.querySelectorAll('.delete-member').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Delete this member?')) return;
            const id = e.target.dataset.id;
            await fetch(`${API_MEMBERS}/${id}`, { method: 'DELETE' });
            loadMembers();
            if (borrowingsTab.classList.contains('active')) loadBorrowings();
        });
    });
}

// Load and render borrowings
async function loadBorrowings() {
    const borrows = await fetchBorrowings();
    renderBorrowings(borrows);
}

function renderBorrowings(borrows) {
    if (!borrows.length) {
        borrowingsList.innerHTML = '<p>No borrowings.</p>';
        return;
    }
    borrowingsList.innerHTML = borrows.map(borrow => {
        const isOverdue = !borrow.returnDate && new Date(borrow.dueDate) < new Date();
        const fineDisplay = borrow.fineAmount ? `$${borrow.fineAmount.toFixed(2)}` : '$0.00';
        return `
        <div class="card" data-id="${borrow._id}">
            <h3>${escapeHtml(borrow.book?.title || 'Unknown')}</h3>
            <div class="details">
                <p><strong>Borrower:</strong> ${escapeHtml(borrow.member?.name || 'Unknown')} (${escapeHtml(borrow.member?.studentId || 'N/A')})</p>
                <p><strong>Issued:</strong> ${new Date(borrow.issueDate).toLocaleDateString()}</p>
                <p><strong>Due:</strong> ${new Date(borrow.dueDate).toLocaleDateString()} ${isOverdue ? '<span class="badge overdue">Overdue!</span>' : ''}</p>
                ${borrow.returnDate ? `<p><strong>Returned:</strong> ${new Date(borrow.returnDate).toLocaleDateString()}</p>` : ''}
                <p><strong>Fine:</strong> ${fineDisplay} ${borrow.finePaid ? '(Paid)' : '(Unpaid)'}</p>
            </div>
            <div class="card-actions">
                ${!borrow.returnDate ? `<button class="btn return-btn" data-id="${borrow._id}">↩️ Return</button>` : ''}
                ${borrow.fineAmount > 0 && !borrow.finePaid ? `<button class="btn pay-fine-btn" data-id="${borrow._id}">💰 Pay Fine</button>` : ''}
            </div>
        </div>
    `}).join('');

    document.querySelectorAll('.return-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            await fetch(`${API_BORROWS}/${id}/return`, { method: 'POST' });
            loadBorrowings();
            if (booksTab.classList.contains('active')) loadBooks();
        });
    });

    document.querySelectorAll('.pay-fine-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            await fetch(`${API_BORROWS}/${id}/pay-fine`, { method: 'POST' });
            loadBorrowings();
        });
    });
}

// Escape HTML
function escapeHtml(unsafe) {
    return unsafe ? unsafe.replace(/[&<>"]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    }) : '';
}

// Form submissions
bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('bookId').value;
    const data = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        isbn: document.getElementById('isbn').value || undefined,
        year: document.getElementById('year').value ? parseInt(document.getElementById('year').value) : undefined,
        totalCopies: parseInt(document.getElementById('totalCopies').value)
    };
    const url = id ? `${API_BOOKS}/${id}` : API_BOOKS;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) {
        bookModal.style.display = 'none';
        loadBooks();
        if (borrowingsTab.classList.contains('active')) loadBorrowings();
    } else {
        const err = await res.json();
        alert('Error: ' + err.error);
    }
});

memberForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('memberId').value;
    const data = {
        name: document.getElementById('memberName').value,
        studentId: document.getElementById('studentId').value,
        email: document.getElementById('email').value || undefined,
        phone: document.getElementById('phone').value || undefined
    };
    const url = id ? `${API_MEMBERS}/${id}` : API_MEMBERS;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) {
        memberModal.style.display = 'none';
        loadMembers();
        // If borrow modal is open, refresh members list
        if (borrowModal.style.display === 'block') {
            const members = await fetchMembers();
            memberSelect.innerHTML = '<option value="">Select a member</option>' + 
                members.map(m => `<option value="${m._id}">${m.name} (${m.studentId})</option>`).join('');
        }
    } else {
        const err = await res.json();
        alert('Error: ' + err.error);
    }
});

borrowForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookId = document.getElementById('borrowBookId').value;
    const memberId = memberSelect.value;
    const dueDate = document.getElementById('dueDate').value;
    if (!memberId) {
        alert('Please select a member');
        return;
    }
    const res = await fetch(`${API_BOOKS}/${bookId}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, dueDate })
    });
    if (res.ok) {
        borrowModal.style.display = 'none';
        loadBooks();
        if (borrowingsTab.classList.contains('active')) loadBorrowings();
    } else {
        const err = await res.json();
        alert('Error: ' + err.error);
    }
});

// Initial load
addBookBtn.addEventListener('click', () => openBookModal());
addMemberBtn.addEventListener('click', () => openMemberModal());
loadBooks();