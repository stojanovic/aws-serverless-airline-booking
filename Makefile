
##########################
# Bootstrapping variables
##########################

PIPENV ?= pipenv

export PYTHONUNBUFFERED := 1

target:
	$(info ${HELP_MESSAGE})
	@exit 0


all: init install build

install:
	@$(MAKE) _install_packages
	@$(MAKE) _install_dev_packages

init:
	yum install jq python36 python36-devel python36-pip -y
	python36 -m pip install --upgrade pip
	python36 -m pip install pipenv

package: ##=> Package local artifacts to S3
	@echo "[+] Packaging artifacts..."

build: ##=> Builds local artifacts using SAM CLI
	@echo "[+] Building artifacts..."

test: ##=> Run pytest
	@echo "[+] Run unit/functional tests for services...."

deploy: ##=> Deploy services
	@echo "[+] Deploying services...."

#############
#  Helpers  #
#############

_install_packages:
	$(info [*] Install required packages...)
	@$(PIPENV) install

_install_dev_packages:
	$(info [*] Install required dev-packages...)
	@$(PIPENV) install -d

define HELP_MESSAGE
	Common usage:

	...::: Bootstraps environment with necessary tools like SAM and Pipenv :::...
	$ make init

	...::: Installs all required packages as defined in the pipfile :::...
	$ make install

	...::: Build local artifacts using Docker :::...
	$ make build

	...::: Run Pytest under tests/ with pipenv :::...
	$ make test
endef
