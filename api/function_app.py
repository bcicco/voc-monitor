import azure.functions as func
from dotenv import load_dotenv


load_dotenv()   # uncomment for local dev
from blueprints.post_stage import stagesBP
from blueprints.breaths_finalise import breathsFinalizeBP
from blueprints.breath_list import breathsListBP
from blueprints.breaths_get import breathsGetBP
from blueprints.stages_list import stagesListBP


app = func.FunctionApp()
app.register_functions(stagesBP)
app.register_functions(breathsFinalizeBP)
app.register_functions(breathsListBP)
app.register_functions(breathsGetBP)
app.register_functions(stagesListBP)