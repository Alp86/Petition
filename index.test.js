const supertest = require("supertest");
const {app} = require("./index");
const cookieSession = require("cookie-session");

test('POST /welcome sets req.session.submitted to true', () => {
    const cookie = {};
    cookieSession.mockSessionOnce(cookie);
    return supertest(app)
        .post('/welcome')
        .then(() => {
            expect(cookie.submitted).toBe(true);
        });
});

test("GET /home sends 200 status code as response when there is a 'submitted' cookie", () => {
    cookieSession.mockSessionOnce({
        submitted: true
    });
    return supertest(app)
        .get('/home')
        .then(res => {
            expect(res.statusCode).toBe(200);
        });
});

test("GET /home sends 302 status code as response when no cookie", () => {
    return supertest(app)
        .get('/home')
        .then(res => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe('/welcome');
        });
});

test("GET /welcome sends 200 status code as response", () => {
    return supertest(app)
        .get("/welcome")
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.text).toBe("hi");
        });
});
