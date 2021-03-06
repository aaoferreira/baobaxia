import json
from calendar import timegm
from datetime import datetime,timedelta

from rest_framework.decorators import api_view
from rest_framework.decorators import authentication_classes, permission_classes

from rest_framework.response import Response
from rest_framework import status
from rest_framework_jwt.settings import api_settings

from django.http import HttpResponseRedirect, HttpResponse
from django.contrib.auth.models import User
from django.template import Template, RequestContext
from django.utils.translation import ugettext as _

from mocambola.serializers import UserSerializer
from bbx.auth import FileBackend
from bbx.utils import logger

@api_view(['GET'])
def mocambola_list(request, repository, mucua):
    # retorna lista de mocambolas
    return Response('')


@api_view(['GET'])
def mocambola_detail(request, repository, mucua, mocambola):
    # retorna detalhes do user

    try:
        user = User.objects.get(username=mocambola)
    except User.DoesNotExist:
        response_data = {
            'error': True,
            'errorMessage': _('User don\t exists')
        }
            
        return HttpResponse(json.dumps(response_data), mimetype=u'application/json')

    # TODO: verificar questao abaixo:
    #  atualmente, esta serializando o user
    #  possivelmente, teria que ter um serializer especifico para mocambola
    #  deixando em aberto

    # serializa e da saida
    serializer = UserSerializer(user)
    return Response(serializer.data)

@api_view(['POST'])
def login(request):
    
    if request.method == 'POST':
        username = request.DATA['username'] + '@' + request.DATA['mucua'] + '.' + request.DATA['repository'] + '.net'
        password = request.DATA['password']
        fileBackend = FileBackend()
        authenticate = fileBackend.authenticate(username, password)
        
        # TODO: get this data from logger or bbx/auth.py,
        # so the next section won't be needed anymore
        if (authenticate):
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                logger.debug(u"%s" % (
                    _('Exception caught, UserDoesNotExist')
                ))
            
            if user:
                # gera token
                
                jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
                jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER
                payload = jwt_payload_handler(user)
                payload['orig_iat'] = timegm(
                    datetime.utcnow().utctimetuple()
                )
                payload['exp'] = datetime.utcnow() + timedelta(minutes=3600)

                response_data = {
                    'username': username,
                    'token': jwt_encode_handler(payload)
                }
                
                return HttpResponse(json.dumps(response_data))
            else:
                response_data = {
                    'errorMessage': _('User don\'t exists: ')
                }
                return HttpResponse(json.dumps(response_data), mimetype=u'application/json')
        else:
            response_data = {
                'error': True,
                'errorMessage': _('Invalid user or password')
            }
            
            return HttpResponse(json.dumps(response_data), mimetype=u'application/json')


@api_view(['POST'])
def create_auth(request):
    serialized = UserSerializer(data=request.DATA)
    if serialized.is_valid():
        User.objects.create_user(
            username=serialized.init_data['username'],
            password=serialized.init_data['password'],
            email=serialized.init_data['email']
        )
        return Response(serialized.data,
                        status=status.HTTP_201_CREATED)
    else:
        return Response(serialized._errors,
                        status=status.HTTP_400_BAD_REQUEST)
