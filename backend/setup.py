import os

from setuptools import setup, find_packages

requires = [
    'tornado',
    'pyjwt[crypto] == 1.5.2',
    'psycopg2'
]


setup(
    name='eng-growth-backend',
    version='0.1.0',
    description='eng-growth-backend',
    classifiers=[
        'Programming Language :: Python',
        'Framework :: Tornado',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Internet :: WWW/HTTP :: WSGI :: Application',
    ],
    author='',
    author_email='',
    url='',
    keywords='tornado',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    install_requires=requires
)