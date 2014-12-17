import json
import os

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from django.template import Template, RequestContext
from django.http import HttpResponse
from django.utils import translation
from django.utils.translation import ugettext as _
from django.shortcuts import render
from django.conf.urls import i18n 


from bbx.settings import LANGUAGES, LANGUAGE_CODE, TEMPLATE_DIRS
from bbx.utils import logger

@api_view(['GET'])
def default_lang(request):
    
    response_data = {
        'defaultLang': LANGUAGE_CODE
    }
    logger.info('default_lang')
    return HttpResponse(json.dumps(response_data), mimetype=u'application/json')

@api_view(['GET'])
def available_langs(request):
    
    response_data = {
        'availableLangs': LANGUAGES
    }
    logger.info('availableLangs')
    return HttpResponse(json.dumps(response_data), mimetype=u'application/json')

def parse_templates(request, module_name, template_name, lang):
    # hack for portuguese
    accepted = ('pt-br', 'pt_br', 'pt-BR')
    if lang in accepted:
        lang = 'pt_BR'
    
    if not any(lang in LANGUAGE for LANGUAGE in LANGUAGES):
        response_data = {
            'error': True,
            'errorMessage': 'Language \'' + lang + '\' not installed'
        }
        return HttpResponse(json.dumps(response_data), mimetype=u'application/json')
    
    translation.activate(lang)
    request.session['django_language'] = lang    
    
    module_path = os.path.join(TEMPLATE_DIRS[0], module_name)
    template_name = os.path.join(TEMPLATE_DIRS[0], module_name, template_name)
    
    # check if module exists    
    module_exists = os.path.isdir(os.path.join(TEMPLATE_DIRS[0], module_name))
    if not module_exists:
        return HttpResponse(_("Module does not exists: ") + module_path)

    # check if template exists
    template_exists = os.path.isfile(template_name)
    if not template_exists:
        return HttpResponse(_("Template does not exists: ") + template_name)
    
    return render(request, template_name)