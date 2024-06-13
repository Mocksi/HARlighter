import Rollbar from "rollbar";

const RollbarConfig: Rollbar.Configuration = {
	accessToken: "be43d6878072493da0c2522efd1eaa21",
	// TODO: disable Rollbar in development
	environment: "production",
	captureUncaught: true,
	captureUnhandledRejections: true,
};
const MocksiRollbar = new Rollbar(RollbarConfig);

export default MocksiRollbar;
