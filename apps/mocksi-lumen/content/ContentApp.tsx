import("./content.css");
import("./base.css");

export default function ContentApp() {
	return (
		<div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4">
			<div className="bg-gray-100 p-4">
				<h1 className="text-2xl font-bold">Hello, Tailwind!</h1>
			</div>
			<div className="shrink-0">ji</div>
			<div>
				<div className="text-xl font-medium text-black">ChitChat</div>
				<p className="text-slate-500">You have a new message!</p>
			</div>
		</div>
	);
}
