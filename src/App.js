import { useState, useEffect, useRef } from "react";
import StarRating from "./StarRating";
// const tempMovieData = [
//   {
//     imdbID: "tt1375666",
//     Title: "Inception",
//     Year: "2010",
//     Poster:
//       "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
//   },
//   {
//     imdbID: "tt0133093",
//     Title: "The Matrix",
//     Year: "1999",
//     Poster:
//       "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
//   },
//   {
//     imdbID: "tt6751668",
//     Title: "Parasite",
//     Year: "2019",
//     Poster:
//       "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg",
//   },
// ];

// const tempWatchedData = [
//   {
//     imdbID: "tt1375666",
//     Title: "Inception",
//     Year: "2010",
//     Poster:
//       "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
//     runtime: 148,
//     imdbRating: 8.8,
//     userRating: 10,
//   },
//   {
//     imdbID: "tt0088763",
//     Title: "Back to the Future",
//     Year: "1985",
//     Poster:
//       "https://m.media-amazon.com/images/M/MV5BZmU0M2Y1OGUtZjIxNi00ZjBkLTg1MjgtOWIyNThiZWIwYjRiXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg",
//     runtime: 116,
//     imdbRating: 8.5,
//     userRating: 9,
//   },
// ];

const average = (arr) =>
  arr?.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const KEY = "426a03fa";

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);

  const [error, setError] = useState("");

  const [loader, setLoader] = useState(false);

  const [selected, setSelected] = useState(null);

  // const [watched, setWatched] = useState([]);
  const [watched, setWatched] = useState(() => {
    const storedValue = localStorage.getItem("watched");
    return JSON.parse(storedValue) || []; // Ensure that the value is always an array or initialize as an empty array
  });
  const selectHandler = (id) => {
    setSelected(id === selected ? null : id);
  };

  const watchedHandler = (movie) => {
    setWatched((watched) => [...watched, movie]);
  };

  const deleteHandler = (id) => {
    setWatched(watched.filter((movie) => movie.imdbID !== id));
  };
  useEffect(() => {
    localStorage.setItem("watched", JSON.stringify(watched));
  }, [watched]);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchMovies() {
      try {
        setError(false);
        setLoader(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Something went wrong!");

        const data = await res.json();

        if (data.Response === "False") throw new Error("Movie not found!");
        setMovies(data.Search);
        setLoader(false);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoader(false);
      }
    }
    if (!query) {
      setMovies([]);
      setError("");
      return;
    }
    fetchMovies();
    return function () {
      controller.abort();
    };
  }, [query]);

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {loader && <Loading />}
          {!loader && !error && (
            <MovieList
              movies={movies}
              selectHandler={selectHandler}
              watched={watched}
            />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selected ? (
            <SelectedMovie
              setSelected={setSelected}
              selected={selected}
              watchedHandler={watchedHandler}
              watched={watched}
              deleteHandler={deleteHandler}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                deleteHandler={deleteHandler}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputRef = useRef(null);
  useEffect(() => {
    const callBack = (e) => {
      if (document.activeElement === inputRef.current) return;
      if (e.code === "Enter") {
        inputRef.current.focus();
        setQuery("");
      }
    };
    document.addEventListener("keydown", callBack);
    return () => document.addEventListener("keydown", callBack);
  }, [setQuery]);

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputRef}
    />
  );
}
function Loading() {
  return <p className="loader">Loading...</p>;
}
function ErrorMessage({ message }) {
  return <p className="error">{message}</p>;
}
function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>

      {isOpen && children}
    </div>
  );
}

/*
function WatchedBox() {
  const [watched, setWatched] = useState(tempWatchedData);
  const [isOpen2, setIsOpen2] = useState(true);

  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen2((open) => !open)}
      >
        {isOpen2 ? "–" : "+"}
      </button>

      {isOpen2 && (
        <>
          <WatchedSummary watched={watched} />
          <WatchedMoviesList watched={watched} />
        </>
      )}
    </div>
  );
}
*/

function MovieList({ movies, selectHandler, watched }) {
  return (
    <ul className="list list-movies ">
      {movies?.map((movie) => (
        <Movie movie={movie} selectHandler={selectHandler} key={movie.imdbID} />
      ))}
    </ul>
  );
}

function Movie({ movie, selectHandler }) {
  return (
    <li onClick={() => selectHandler(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}
function SelectedMovie({ selected, setSelected, watchedHandler, watched }) {
  const [movie, setMovie] = useState({});
  const [loader, setLoader] = useState();
  const [userRating, setUserRating] = useState("");
  const isWatched = watched?.map((movie) => movie.imdbID).includes(selected);

  //count how many times the user changed the movie rating before adding to list

  //useRef resist the value even there is re-renders
  const rateRef = useRef(0);
  useEffect(() => {
    if (userRating) rateRef.current = rateRef.current + 1;
  }, [userRating]);
  const watchedUserRating = watched?.find(
    (movie) => movie.imdbID === selected
  )?.userRating;
  const {
    Title: title,

    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  //when we click the "Enter" button the input get focused
  useEffect(
    function () {
      const callBack = (e) => {
        if (e.code === "Escape") {
          setSelected(null);
        }
      };

      document.addEventListener("keydown", callBack);
      return function () {
        document.removeEventListener("keydown", callBack);
      };
    },
    [setSelected]
  );

  useEffect(
    function () {
      async function getMovieDetails() {
        setLoader(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&i=${selected}`
        );
        const data = await res.json();
        console.log(data);
        setMovie(data);

        setLoader(false);
      }
      getMovieDetails();
    },
    [selected]
  );
  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = "UsePopCorn";
      };
    },
    [title]
  );
  const addWatched = () => {
    const newWatched = {
      imdbID: selected,
      title,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      ratingRef: rateRef.current,
    };

    watchedHandler(newWatched);
    setSelected(null);
  };

  return (
    <div className="details">
      {loader ? (
        <Loading />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={() => setSelected(null)}>
              &larr;
            </button>
            <img src={poster} alt={`poster of ${title}`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}{" "}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span> {imdbRating} IMDB rating
              </p>
            </div>
          </header>

          <section>
            {!isWatched ? (
              <div className="rating">
                <StarRating
                  size={24}
                  maxRating={10}
                  onSetRating={setUserRating}
                />
                {userRating > 0 && (
                  <button className="btn-add" onClick={addWatched}>
                    + Add to list
                  </button>
                )}
              </div>
            ) : (
              <p className="rating">
                You rated this movies with {watchedUserRating} ⭐️
              </p>
            )}
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director} </p>
          </section>
        </>
      )}
    </div>
  );
}
function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched?.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched?.map((movie) => movie.userRating));
  const avgRuntime = average(watched?.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched?.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating?.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating?.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime?.toFixed(2)} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, deleteHandler }) {
  return (
    <ul className="list">
      {watched?.map((movie) => (
        <WatchedMovie
          deleteHandler={deleteHandler}
          movie={movie}
          key={movie.imdbID}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, deleteHandler }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
      </div>
      <button
        className="btn-delete"
        onClick={() => deleteHandler(movie.imdbID)}
      >
        X
      </button>
    </li>
  );
}
