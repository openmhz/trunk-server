var request = require('supertest');

describe('loading express', function () {
    var server;
    beforeEach(function () {
        server = require('../index');
    });
    afterEach(function () {
        server.close();
    });
   /* it('responds to /call/576213019f9c3d0100539da8', function testSlash(done) {
        request(server)
            .get('/call/576213019f9c3d0100539da8')
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                done();
            });
    });*/
    it('responds to /channels', function testSlash(done) {

        request(server)
            .get('/channels')
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                done();
            });
    });
   /* it('404 everything else', function testPath(done) {
        request(server)
            .get('/foo/bar')
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err);
                done();
            });
    });*/
});
