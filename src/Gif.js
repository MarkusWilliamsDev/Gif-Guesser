import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import randomWord from "./randomWord";

/**
	BUGS:
		[X]Reset input not working on first value
		[ ]Skip word and lose points on last guess
		[ ]Optimize for 4G
	TODO:
		[ ]Add env variable key
		[ ]Add report functionality 
			[X]Create express server to receive POST of word
			[X]Store word in db
			[ ]Allow report of previous word?
		[ ]Create about page
			[ ]Route to page
			[ ]Link to portfolio?
				[ ]GitHub?
**/

export default function Gif() {
	const API_URL_BASE =
		"https://api.giphy.com/v1/gifs/search?api_key=e3VSkYg6dHt7sY4o1us0anHs6KwmtARe&q=";
	const API_URL_PARAM = "&limit=1&offset=0&rating=g&lang=en";

	/** STATES **/
	const [word, setWord] = useState("design loop loading");
	const [gifURL, setGifURL] = useState();
	const [score, setScore] = useState(0);
	const [hintsUsed, setHintsUsed] = useState(0);
	const [miss, setMiss] = useState(0);
	const [started, setStarted] = useState(false);
	const [hint, setHint] = useState([]);
	const [report, setReport] = useState(false);

	/** FORM **/
	const { register, reset, handleSubmit } = useForm({
		defaultValues: { something: "anything" },
	});

	const hintCost = 1;
	const incorrectCost = 0.5;
	const correctPoints = 3;

	const onSubmit = (data) => {
		reset("");
		if (data.guess.length > 0) {
			if (data.guess.toUpperCase() === word.toUpperCase()) {
				setScore(score + correctPoints);
				setWord(randomWord());
				reset("");
			} else {
				setMiss(miss + 1);
				setScore(score - incorrectCost);
				reset("");
			}
		}
	};

	// Sets gifURL to whatever is found with word
	useEffect(() => {
		axios.get(API_URL_BASE + word + API_URL_PARAM).then((response) => {
			if (response) {
				setGifURL(response.data.data[0].images.fixed_height.url);
			} else {
				console.log(`${word} did not have a valid gif`);
				setWord(randomWord);
			}
		});
	}, [word]);

	useEffect(() => {
		if (word) {
			let wordArray = [];
			for (let i = 0; i < word.length; i++) {
				wordArray.push("_");
			}
			setHint(wordArray);
		}
	}, [word]);

	const getHint = () => {
		setHintsUsed(hintsUsed + 1);
		let ranIndex = Math.floor(Math.random() * word.length);
		if (hint.includes("_")) {
			if (hint[ranIndex] === word[ranIndex]) {
				getHint();
			}
			setScore(score - hintCost);
			setHint(() => {
				let hintArray = hint;
				hintArray[ranIndex] = word[ranIndex];
				setHint(hintArray);
			});
		} else {
			reset("");
			setWord(randomWord);
			setScore(score - 5);
			setHintsUsed(hintsUsed);
			setMiss(miss + 1);
		}
	};

	const sendReport = () => {
		const data = { word: word, url: gifURL };
		const options = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		};
		fetch("http://localhost:3001/api", options);
		console.log(`Reported ${word}`);
	};

	return report ? (
		<div className="flex h-screen bg-gray-50">
			<div className="m-auto text-center">
				<div className="flex flex-col">
					<h1 className="text-2xl font-bold">Reasons to report:</h1>
					<ul className="text-xl text-left mx-auto">
						<li>1) Word and gif don't match</li>
						<li>2) Word or gif are innapropriate</li>
					</ul>
				</div>
				<button
					className="bg-red-500 p-4 m-4 rounded-md text-2xl text-gray-100 hover:bg-red-600"
					onClick={() => {
						sendReport();
						setReport(false);
						setWord(randomWord);
					}}
				>
					Yes, report and skip this word
				</button>
				<button
					className="bg-yellow-500 p-4 m-4 rounded-md text-2xl text-gray-100 hover:bg-yellow-600"
					onClick={() => {
						setReport(false);
					}}
				>
					No, go back
				</button>
			</div>
		</div>
	) : started ? (
		<div className="flex flex-col items-center justify-center md:h-screen">
			{/* Image Container */}
			<div className="m-6 h-1/4 lg:h-1/2">
				<img
					src={gifURL}
					alt="Random Gif"
					className="rounded-md h-full m-auto"
				/>
			</div>
			<div className="flex text-4xl font-light" style={{ letterSpacing: 6 }}>
				{hint}
			</div>
			<p className="text-4xl font-bold">
				Score:{" "}
				{score === 0 ? (
					<span>{score}</span>
				) : score > 0 ? (
					<span className="text-green-600">{score}</span>
				) : (
					<span className="text-red-600">{score}</span>
				)}
			</p>

			<div className="flex">
				<p className="text-lg font-medium">
					Hints:{" "}
					{hintsUsed > 0 ? (
						<span className="text-red-600">{hintsUsed}</span>
					) : (
						<span>{hintsUsed}</span>
					)}
				</p>
				<p className="text-lg fontg-medium ml-2">
					Misses:{" "}
					{miss > 0 ? (
						<span className="text-red-600">{miss}</span>
					) : (
						<span>{miss}</span>
					)}
				</p>
			</div>
			<form
				autoComplete="off"
				onSubmit={handleSubmit(onSubmit)}
				className="grid"
			>
				<input type="text" maxLength={word.length} {...register("guess", {})} />
				{/* <div className="md:flex md:flex-row md:w-full md:justify-center"> */}
				<div className="flex flex-row">
					<div className="has-tooltip my-6">
						<span className="tooltip rounded md:shadow-lg p-1 mx-8 md:bg-gray-100 text-transparent md:text-red-500 -mt-10">
							Costs {hintCost} point
						</span>
						<button
							onClick={getHint}
							type="reset"
							className="bg-yellow-400 w-48 p-4 mx-4 md:mx-8 text-2xl text-gray-100 rounded-md hover:bg-yellow-500"
						>
							Get Hint
						</button>
					</div>
					<button
						type="submit"
						className="bg-green-400 w-48 p-4 mx-4 md:mx-8 my-6 text-2xl text-gray-100 rounded-md hover:bg-green-500"
					>
						Check Guess
					</button>
				</div>
			</form>
			<button
				onClick={() => {
					setReport(true);
					reset("");
				}}
				className="bg-red-400 w-32 p-2 mx-8 my-6 text-md text-gray-100 rounded-md hover:bg-red-500"
			>
				Report Word
			</button>
		</div>
	) : (
		// Game Start
		<div className="h-screen relative">
			<div className="flex h-1/3 justify-center">
				<img
					src="https://media.giphy.com/media/8lQyyys3SGBoUUxrUp/giphy.gif"
					alt="Thinking Emoji Gif"
					className="xl:hidden"
				/>
			</div>
			<div className="xl:grid xl:grid-cols-3 my-0">
				<div className="hidden xl:flex xl:justify-center">
					<img
						src="https://media.giphy.com/media/8lQyyys3SGBoUUxrUp/giphy.gif"
						alt="Thinking Emoji Gif"
						className="mx-0"
					/>
				</div>
				<div className="h-full flex flex-col items-center justify-center">
					<div className="flex">
						<h1 className="text-4xl xl:text-5xl font-black px-1">
							Gif Guesser
						</h1>
						<span className="self-end">
							<p className="font-light">beta</p>
						</span>
					</div>
					<p className="text-lg font-light mt-6 w-96 text-center px-4">
						You will be given a gif generated from a random word. Your job is to
						guess what the word is from just the gif.
					</p>
					<div className="text-lg font-extralight my-3 w-96 text-center px-4">
						<ol>
							<li>
								Hint:{" "}
								<span className="text-red-700 font-light">
									-{hintCost} point
								</span>
							</li>
							<li>
								Incorrect guess:{" "}
								<span className="text-red-700 font-light">
									-{incorrectCost} points
								</span>
							</li>
							<li>
								Using all hints:{" "}
								<span className="text-red-700 font-light">
									-5 points & skip word
								</span>
							</li>
							<li>
								Correct guess:{" "}
								<span className="text-green-700 font-light">
									+{correctPoints} points
								</span>
							</li>
						</ol>
					</div>
					<button
						onClick={() => {
							setWord(randomWord());
							setStarted(true);
						}}
						className="animate-bounce bg-green-400 p-6 m-6 text-xl text-gray-100 rounded-md shadow-md hover:bg-green-500 focus:bg-green-600"
					>
						Start Game
					</button>
				</div>
				<div className="hidden xl:flex xl:justify-center">
					<img
						src="https://media.giphy.com/media/8lQyyys3SGBoUUxrUp/giphy.gif"
						alt="Thinking Emoji Gif"
						className="mx-0"
					/>
				</div>
			</div>

			<div className="absolute bottom-6 right-6">
				<a href="https://www.markusdev.com" target="_blank" rel="noreferrer">
					<button className="bg-gray-400 text-white p-2 text-sm rounded-md shadow-md hover:bg-gray-500 hover:text-gray-50 hover:shadow-lg">
						About the Creator
					</button>
				</a>
			</div>
		</div>
	);
}
