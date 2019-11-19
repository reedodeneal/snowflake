import tornado.web, tornado.httpserver, tornado.ioloop
import application_handler
import logging
import sys


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


router = [
    (r"/post", application_handler.Saver),
    (r"/get", application_handler.Getter),
]

application = tornado.web.Application(router)


if __name__ == "__main__":
    try:
        c = application_handler.create_conn()
        c.close()
    except Exception as e:
        raise e
        sys.exit(1)

    server = tornado.httpserver.HTTPServer(application)
    server.listen(3001)
    tornado.ioloop.IOLoop.instance().start()