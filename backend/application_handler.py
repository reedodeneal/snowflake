import tornado.web
import psycopg2, json
from tornado import escape
import os


def create_conn():
    try:
        connect_str = "dbname=" + \
            os.getenv('DBNAME') + " user=" + \
            os.getenv('DBUSER') + " host=" + \
            os.getenv('DBHOST') + " password=" + \
            os.getenv('DBPASSWORD') + " connect_timeout=5"
        return psycopg2.connect(connect_str)
    except Exception as e:
        raise e


def add_or_update_user_datastore(username, data):
    c = create_conn()
    cur = c.cursor()
    cur.execute("INSERT INTO user_data (username, json) \
        VALUES ('" + username + "','" + json.dumps(data) + "') ON CONFLICT (username) \
        DO UPDATE SET json = '" + json.dumps(data) + "';")
    c.commit()
    cur.close()
    c.close()
    return True


def get_from_user_datastore(username):
    c = create_conn()
    cur = c.cursor()
    cur.execute('SELECT json from user_data WHERE username=\'' + username + '\'')
    rows = cur.fetchall()
    cur.close()
    c.close()
    try:
        return rows[0][0]
    except IndexError:
        return False

class BaseHandler(tornado.web.RequestHandler):
    def get(self):
        return self


class Saver(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")

    def post(self):
        try:
            data = escape.json_decode(self.request.body)
            add_or_update_user_datastore(data["username"], data)
            self.set_status(202)
        except json.decoder.JSONDecodeError as e:
            self.set_status(400)


class Getter(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")

    def get(self):
        r = get_from_user_datastore(self.get_argument("username"))
        if r:
            self.write(json.dumps(str(r)))
        else:
            self.set_status(404)