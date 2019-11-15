import tornado.web, tornado.httpserver, tornado.ioloop
import application_handler
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


router = [
    (r"/update", application_handler.Saver),
    (r"/get", application_handler.Getter),
]

application = tornado.web.Application(router)


if __name__ == "__main__":
    server = tornado.httpserver.HTTPServer(application)
    server.listen(3001)
    tornado.ioloop.IOLoop.instance().start()