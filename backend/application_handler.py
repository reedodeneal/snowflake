import tornado.web
import psycopg2, json
from tornado import escape


def create_conn():
    try:
        connect_str = "dbname='snowflake-backend' user='postgres' \
                       host='snowflake-backend.c895fmnyjack.us-east-1.rds.amazonaws.com' " + \
                      "password='EWRqq092LraBypuTdP48'"
        return psycopg2.connect(connect_str)
    except Exception as e:
        raise e


def insert_postgres(username, data):
    c = create_conn()
    cur = c.cursor()
    cur.execute("INSERT INTO user_value_hashes (username, value_hash) \
        VALUES ('" + username + "','" + json.dumps(data) + "') ON CONFLICT (username) \
        DO UPDATE SET value_hash = '" + json.dumps(data) + "';")
    c.commit()
    cur.close()
    c.close()
    return True


def query_postgres(username):
    c = create_conn()
    cur = c.cursor()
    cur.execute('SELECT value_hash from user_value_hashes WHERE username=\'' + username + '\'')
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
            insert_postgres(data["username"], data)
            self.set_status(202)
        except json.decoder.JSONDecodeError as e:
            self.set_status(400)


class Getter(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")

    def get(self):
        r = query_postgres(self.get_argument("username"))
        if r:
            self.write(json.dumps(str(r)))
        else:
            self.set_status(404)