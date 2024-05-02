import { expect, test } from "vitest";
import ApiMock from "./api_mock";

const mockData = {
  'GET /api/users': {
      ResponseBody: JSON.stringify({
          Content: JSON.stringify({
              success: true,
              ContentLength: 19,
              ContentType: "application/json",
              Headers: "Date: Wed, 01 May 2024 07:04:37 GMT\nContent-Type: application/json\nContent-Length: 19\n"
          }),
      }),
      ResponseStatus: 200,
      ResponseHeaders: {
          'Content-Type': 'application/json',
          Server: 'cloudflare'
      },
  },
  'POST /api/create': {
      ResponseBody: JSON.stringify({
          id: "0",
          json: JSON.stringify({
              method: "POST",
              url: "https://foobar.com/echo/post/json",
              content: JSON.stringify({ Id: 78912, Customer: "Jason Sweet", Quantity: 1, Price: 18.00 }),
              headers: "Content-Type: application/json\n"
          }),
      }),
      ResponseStatus: 201,
      ResponseHeaders: {
          'Content-Type': 'application/json',
          Server: 'cloudflare'
      },
  },
  'GET /api/error': {
      ResponseBody: JSON.stringify({ message: "Not Found" }),
      ResponseStatus: 404,
      ResponseHeaders: { 'Content-Type': 'application/json' },
  }
};


test("should return a mocked response for a valid URL", async () => {
	const apiMock = new ApiMock({ mockData, delay: 100 });
	const response = await apiMock.fetch("/api/users");
	const data = JSON.parse(JSON.parse(await response.text()).Content);

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, ContentLength: 19, ContentType: 'application/json', Headers: 'Date: Wed, 01 May 2024 07:04:37 GMT\nContent-Type: application/json\nContent-Length: 19\n' });
});

test('should handle a POST request with a JSON body', async () => {
    const apiMock = new ApiMock({ mockData, delay: 100 });
    const requestBody = JSON.stringify({ username: 'johndoe', email: 'john@example.com' });

    const response = await apiMock.fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
    });

    const data = JSON.parse(await response.text());

    expect(response.status).toBe(201);
    expect(data).toEqual({ id: '0', json: "{\"method\":\"POST\",\"url\":\"https://foobar.com/echo/post/json\",\"content\":\"{\\\"Id\\\":78912,\\\"Customer\\\":\\\"Jason Sweet\\\",\\\"Quantity\\\":1,\\\"Price\\\":18}\",\"headers\":\"Content-Type: application/json\\n\"}" });
});
