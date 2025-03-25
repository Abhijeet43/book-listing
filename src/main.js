const elements = {
  booksContainer: document.querySelector("#books-container"),
  searchInput: document.querySelector("#search-input"),
  viewToggleButton: document.querySelector("#view-toggle"),
  filterSelect: document.querySelector("#filter-select"),
  noResult: document.createElement("p"),
  loader: document.createElement("div"),
};

elements.noResult.classList = "text-gray-500 mx-auto text-center w-full";
elements.noResult.textContent = "No books found.";

elements.loader.classList = "w-full text-center py-4";
elements.loader.innerHTML = `<div class="w-8 h-8 rounded-full border-4 border-solid border-current border-r-transparent align-[0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
  <span class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
</div>`;

const config = {
  apiEndpoint: "https://api.freeapi.app/api/v1/public/books",
  debounceDelay: 300,
  perPage: 9,
  initialPage: 1,
  shimmerCount: 6,
  scrollThreshold: 300,
};

const state = {
  currentPage: config.initialPage,
  books: [],
  hasMoreBooks: true,
  isLoading: false,
  searchQuery: "",
  sortBy: "",
  view: "grid",
};

/**
 * Creates a shimmer loading placeholder element
 */
function createShimmerElement() {
  return `<div class="bg-white shadow-lg border border-gray-300 rounded-lg w-80 sm:w-96 animate-pulse">
    <div>
      <div class="text-center bg-gray-300 rounded-lg h-52"></div>
      <div class="mt-2 p-2 text-center">
        <div class="bg-gray-300 rounded w-3/4 h-4 mx-auto mb-2"></div>
        <div class="bg-gray-300 rounded w-1/2 h-4 mx-auto mb-2"></div>
        <div class="bg-gray-300 rounded w-2/3 h-4 mx-auto"></div>
      </div>
    </div>
  </div>`;
}

/**
 * Sets the loading state and updates UI accordingly
 */
function setLoadingState(isLoading, isInitial = false) {
  state.isLoading = isLoading;

  if (isLoading) {
    if (isInitial) {
      elements.booksContainer.innerHTML = Array.from(
        { length: config.shimmerCount },
        createShimmerElement
      ).join("");
    } else {
      elements.booksContainer.appendChild(elements.loader);
    }
  } else if (elements.booksContainer.contains(elements.loader)) {
    elements.booksContainer.removeChild(elements.loader);
  }
}

/**
 * Handles and displays errors
 */
function showError(error) {
  console.error("Error:", error.message);
  state.hasMoreBooks = false;
  state.isLoading = false;

  const errorMessage = document.createElement("div");
  errorMessage.classList = "w-full text-center text-red-500 py-4";
  errorMessage.textContent = "Failed to load books. Please try again later.";

  if (!elements.booksContainer.querySelector(".text-red-500")) {
    elements.booksContainer.appendChild(errorMessage);
  }
}

/**
 * Filters and sorts the displayed books based on query and sort criteria
 */
function filterAndSortBooks(query = "", sortBy = state.sortBy) {
  state.searchQuery = query;
  state.sortBy = sortBy;

  renderBooks(state.books);
}

/**
 * Handles search input events
 */
function handleSearch(event) {
  const query = event.target.value.toLowerCase().trim();
  filterAndSortBooks(query, state.sortBy);
}

/**
 * Handles sort selection events
 */
function handleSort(event) {
  const sortBy = event.target.value;
  filterAndSortBooks(state.searchQuery, sortBy);
}

/**
 * Creates a book card element
 */
function createBookCard(book) {
  const articleWrapper = document.createElement("a");
  articleWrapper.href = book?.volumeInfo?.infoLink || "#";
  articleWrapper.target = "_blank";
  articleWrapper.rel = "noopener noreferrer";

  // Dynamic classes based on view
  const baseClasses =
    "block shadow-lg rounded-lg p-2 mb-4 hover:shadow-xl transition-shadow duration-300";
  const gridClasses = "w-full sm:w-80 text-center";
  const listClasses = "flex w-full items-start space-x-4";

  articleWrapper.classList =
    state.view === "grid"
      ? `${baseClasses} ${gridClasses}`
      : `${baseClasses} ${listClasses}`;

  articleWrapper.dataset.title = book?.volumeInfo?.title || "";
  articleWrapper.dataset.author = book?.volumeInfo?.authors?.join(", ") || "";

  const article = document.createElement("article");
  article.classList =
    state.view === "grid" ? "block" : "flex flex-1 items-start";

  const thumbnail = document.createElement("img");
  thumbnail.src =
    book?.volumeInfo?.imageLinks?.thumbnail ||
    "https://via.placeholder.com/150x200?text=No+Cover";
  thumbnail.alt = book?.volumeInfo?.title || "Book cover";

  // Dynamic thumbnail classes
  const thumbnailBaseClasses = "object-cover rounded-t-lg";
  const gridThumbnailClasses = "h-40 mx-auto";
  const listThumbnailClasses = "h-24 w-24 flex-shrink-0";

  thumbnail.classList =
    state.view === "grid"
      ? `${thumbnailBaseClasses} ${gridThumbnailClasses}`
      : `${thumbnailBaseClasses} ${listThumbnailClasses}`;

  thumbnail.onerror = function () {
    this.src = "https://via.placeholder.com/150x200?text=No+Cover";
  };

  const bookDetails = document.createElement("div");
  bookDetails.classList =
    state.view === "grid" ? "mt-2 text-center" : "flex-1 ml-4";

  const title = document.createElement("h2");
  title.textContent = book?.volumeInfo?.title || "Untitled Book";
  title.classList =
    state.view === "grid"
      ? "text-lg font-semibold mt-2 line-clamp-2"
      : "text-lg font-semibold";

  const authors = document.createElement("p");
  authors.textContent = `By: ${
    book?.volumeInfo?.authors?.join(", ") || "Unknown"
  }`;
  authors.classList =
    state.view === "grid" ? "text-sm text-gray-600" : "text-sm text-gray-600";

  const publisher = document.createElement("p");
  publisher.textContent = `Publisher: ${
    book?.volumeInfo?.publisher || "Unknown"
  }`;
  publisher.classList =
    state.view === "grid" ? "text-sm text-gray-600" : "text-sm text-gray-600";

  const publishedDate = document.createElement("p");
  publishedDate.textContent = `Published: ${
    book?.volumeInfo?.publishedDate || "Unknown"
  }`;
  publishedDate.classList =
    state.view === "grid" ? "text-sm text-gray-600" : "text-sm text-gray-600";

  bookDetails.append(title, authors, publisher, publishedDate);

  article.append(thumbnail, bookDetails);
  articleWrapper.append(article);

  return articleWrapper;
}

/**
 * Toggles between grid and list view
 */
function toggleView() {
  state.view = state.view === "grid" ? "list" : "grid";

  const baseClasses = "grid p-4";
  const gridClasses = "grid-cols-3 gap-4";
  const listClasses = "grid-cols-1 gap-8";

  elements.booksContainer.classList =
    state.view === "grid"
      ? `${baseClasses} ${gridClasses}`
      : `${baseClasses} ${listClasses}`;

  elements.viewToggleButton.innerHTML =
    state.view === "grid"
      ? `<svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {" "}
          <path
            d="M8 6L21 6.00078M8 12L21 12.0008M8 18L21 18.0007M3 6.5H4V5.5H3V6.5ZM3 12.5H4V11.5H3V12.5ZM3 18.5H4V17.5H3V18.5Z"
            stroke="#ffffff"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>{" "}
        </g>
      </svg>`
      : `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {" "}
          <path
            d="M17 14V20M14 17H20M15.6 10H18.4C18.9601 10 19.2401 10 19.454 9.89101C19.6422 9.79513 19.7951 9.64215 19.891 9.45399C20 9.24008 20 8.96005 20 8.4V5.6C20 5.03995 20 4.75992 19.891 4.54601C19.7951 4.35785 19.6422 4.20487 19.454 4.10899C19.2401 4 18.9601 4 18.4 4H15.6C15.0399 4 14.7599 4 14.546 4.10899C14.3578 4.20487 14.2049 4.35785 14.109 4.54601C14 4.75992 14 5.03995 14 5.6V8.4C14 8.96005 14 9.24008 14.109 9.45399C14.2049 9.64215 14.3578 9.79513 14.546 9.89101C14.7599 10 15.0399 10 15.6 10ZM5.6 10H8.4C8.96005 10 9.24008 10 9.45399 9.89101C9.64215 9.79513 9.79513 9.64215 9.89101 9.45399C10 9.24008 10 8.96005 10 8.4V5.6C10 5.03995 10 4.75992 9.89101 4.54601C9.79513 4.35785 9.64215 4.20487 9.45399 4.10899C9.24008 4 8.96005 4 8.4 4H5.6C5.03995 4 4.75992 4 4.54601 4.10899C4.35785 4.20487 4.20487 4.35785 4.10899 4.54601C4 4.75992 4 5.03995 4 5.6V8.4C4 8.96005 4 9.24008 4.10899 9.45399C4.20487 9.64215 4.35785 9.79513 4.54601 9.89101C4.75992 10 5.03995 10 5.6 10ZM5.6 20H8.4C8.96005 20 9.24008 20 9.45399 19.891C9.64215 19.7951 9.79513 19.6422 9.89101 19.454C10 19.2401 10 18.9601 10 18.4V15.6C10 15.0399 10 14.7599 9.89101 14.546C9.79513 14.3578 9.64215 14.2049 9.45399 14.109C9.24008 14 8.96005 14 8.4 14H5.6C5.03995 14 4.75992 14 4.54601 14.109C4.35785 14.2049 4.20487 14.3578 4.10899 14.546C4 14.7599 4 15.0399 4 15.6V18.4C4 18.9601 4 19.2401 4.10899 19.454C4.20487 19.6422 4.35785 19.7951 4.54601 19.891C4.75992 20 5.03995 20 5.6 20Z"
            stroke="#ffffff"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>{" "}
        </g>
      </svg>`;

  renderBooks(state.books);
}

/**
 * Fetches books from the API
 */
async function fetchBooks() {
  try {
    const isInitialLoad = state.currentPage === config.initialPage;
    setLoadingState(true, isInitialLoad);

    const response = await fetch(
      `${config.apiEndpoint}?limit=${config.perPage}&page=${state.currentPage}`
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const result = await response.json();
    const books = result?.data?.data || [];

    if (books.length < config.perPage) {
      state.hasMoreBooks = false;
    }

    return books;
  } catch (error) {
    showError(error);
    return [];
  } finally {
    setLoadingState(false);
  }
}

/**
 * Gets filtered and sorted books based on current state
 */
function getFilteredAndSortedBooks(books) {
  // Filter books based on search query
  let filteredBooks = books;
  if (state.searchQuery) {
    filteredBooks = books.filter((book) => {
      const title = book?.volumeInfo?.title?.toLowerCase() || "";
      const author = book?.volumeInfo?.authors?.join(", ")?.toLowerCase() || "";
      return (
        title.includes(state.searchQuery) || author.includes(state.searchQuery)
      );
    });
  }

  // Sort books if sort option is selected
  if (state.sortBy) {
    filteredBooks = [...filteredBooks];
    filteredBooks.sort((a, b) => {
      if (state.sortBy === "title") {
        return (a?.volumeInfo?.title || "").localeCompare(
          b?.volumeInfo?.title || ""
        );
      } else if (state.sortBy === "author") {
        const authorA = a?.volumeInfo?.authors?.[0] || "";
        const authorB = b?.volumeInfo?.authors?.[0] || "";
        return authorA.localeCompare(authorB);
      }
      return 0;
    });
  }

  return filteredBooks;
}

/**
 * Renders books to the DOM
 */
function renderBooks(books) {
  elements.booksContainer.innerHTML = "";

  if (elements.booksContainer.contains(elements.noResult)) {
    elements.booksContainer.removeChild(elements.noResult);
  }

  if (!books || books.length === 0) {
    elements.booksContainer.appendChild(elements.noResult);
    return;
  }

  const booksToRender = getFilteredAndSortedBooks(books);

  if (booksToRender.length === 0) {
    elements.booksContainer.appendChild(elements.noResult);
    return;
  }

  const fragment = document.createDocumentFragment();
  booksToRender.forEach((book) => {
    const bookCard = createBookCard(book);
    fragment.appendChild(bookCard);
  });

  elements.booksContainer.appendChild(fragment);
}

/**
 * Loads more books when scrolling
 */
async function loadMoreBooks() {
  if (state.isLoading || !state.hasMoreBooks) return;

  state.currentPage++;
  const newBooks = await fetchBooks();

  if (newBooks.length > 0) {
    state.books = [...state.books, ...newBooks];

    renderBooks(state.books);
  }
}

/**
 * Creates a debounced version of a function
 */
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Handles scroll events to load more content
 */
function handleScroll() {
  if (state.isLoading || !state.hasMoreBooks) return;

  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - config.scrollThreshold) {
    loadMoreBooks();
  }
}

/**
 * Resets filter and sort options
 */
function resetFilters() {
  elements.searchInput.value = "";
  elements.filterSelect.value = "";
  state.searchQuery = "";
  state.sortBy = "";
  renderBooks(state.books);
}

/**
 * Initializes the application
 */
async function initializeApp() {
  try {
    const books = await fetchBooks();
    state.books = books;
    renderBooks(books);

    elements.searchInput.addEventListener(
      "input",
      debounce(handleSearch, config.debounceDelay)
    );

    elements.filterSelect.addEventListener("change", function (event) {
      const sortBy = event.target.value;

      if (!sortBy) {
        resetFilters();
      } else {
        handleSort(event);
      }
    });

    elements.viewToggleButton.addEventListener("click", toggleView);

    window.addEventListener(
      "scroll",
      debounce(handleScroll, config.debounceDelay)
    );
  } catch (error) {
    showError(error);
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);
