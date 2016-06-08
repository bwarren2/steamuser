from fabric.api import (
    abort,
    local,
    shell_env,
    task,
)

import json


def generate_environment_overrides(env_variables):
    return json.dumps({
        "containerOverrides": [{
            "name": "data-driven-dota",
            "environment": [
                {
                    "name": k,
                    "value": v,
                }
                for (k, v)
                in env_variables.items()
            ]
        }]
    })


def list_containers():
    ret = json.loads(local(
        " ".join((
            "aws",
            "ecs",
            "list-container-instances",
        )),
        capture=True,
    ))
    return ret['containerInstanceArns']


def describe_containers():
    ret = json.loads(local(
        " ".join((
            "aws",
            "ecs",
            "describe-container-instances",
            "--container-instances",
            " ".join((
                list_containers()
            )),
        )),
        capture=True,
    ))
    return [
        (
            inst["runningTasksCount"],
            inst["containerInstanceArn"],
        )
        for inst
        in ret["containerInstances"]
    ]


def get_empty_containers():
    return [
        data[1]
        for data
        in describe_containers()
        if data[0] == 0
    ]


def get_running_tasks():
    return json.loads(local(
        " ".join((
            "aws",
            "ecs",
            "list-tasks",
        )),
        capture=True,
    )).get("taskArns", [])


@task(alias='run', default=True)
def run_image(name, guard=''):
    """
    Call like this to trigger the Steam Guard:

        $ fab run:name

    Then call this:

        $ fab run:name,guard

    Then, you can curl the ECS host:

        $ curl -v http://52.39.102.221:5000/tools/matchurls\?...

    We can put up to five on one host before we'll hit IP rate limit issues, so
    we really need to prioritize multiple ECS hosts.
    """
    empties = get_empty_containers()
    if not empties:
        abort("No available container instances.")
    local(" ".join((
        "aws",
        "ecs",
        "start-task",
        "--task-definition",
        "replay-url-service:3",
        "--container-instances",
        empties[0],
        "--overrides",
        repr(
            generate_environment_overrides(
                dict(
                    STEAM_NAME=name,
                    STEAM_USER=name,
                    STEAM_PASS=pass,
                    STEAM_GUARD=guard,
                )
            )
        ),
    )))


@task
def build_docker_image():
    login_info = local(
        'aws ecr get-login',
        capture=True,
    )
    local(login_info)
    local('docker build -t botapi .')
    local(' '.join((
        'docker',
        'tag -f',
        'botapi:latest',
        '774716370608.dkr.ecr.us-west-2.amazonaws.com/botapi:latest'
    )))
    local(' '.join((
        'docker',
        'push',
        '774716370608.dkr.ecr.us-west-2.amazonaws.com/botapi:latest'
    )))


@task
def stop_all_tasks():
    tasks = get_running_tasks()
    for task_arn in tasks:
        local(" ".join((
            "aws",
            "ecs",
            "stop-task",
            "--task",
            task_arn,
        )))
