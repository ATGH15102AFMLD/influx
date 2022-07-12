
uniform float elapsedTime: ELAPSED_TIME;
uniform float elapsedTimeLevel: ELAPSED_TIME_LEVEL;
uniform float3 cameraPosition: CAMERA_POSITION;
uniform float3 parentPosition: PARENT_POSITION;


float random (float2 uv)
{
    return frac(sin(dot(uv, float2(12.9898f, 78.233f))) * 43758.5453123f);
}

float3 randVUnit (float seed)
{
   float3 v;
   v.x =  random(float2(seed, 0.f)) - 0.5f; 
   v.y =  random(float2(seed, 1.f)) - 0.5f;
   v.z =  random(float2(seed, 2.f)) - 0.5f; 
   return normalize(v);
}

float deg2rad(float deg) 
{
    return ((deg) * 3.14f / 180.f);
}

float3 RndVUnitConus (float3 vBaseNorm, float angle, int partId = 0)
{
    float3   vRand;
    float3   vBaseScale, vTangScale;
    float3   v, vTang;

    v = randVUnit(elapsedTimeLevel);
    vTang = v - vBaseNorm * dot(v, vBaseNorm);

    vTang = normalize(vTang);
    angle = deg2rad(random(float2(elapsedTimeLevel, (float)partId * elapsedTime)) * angle);
    vRand = vBaseNorm * cos(angle) + vTang * sin(angle);
    vRand = normalize(vRand);
    return vRand;
}

struct Part {
    float3 speed;
    float3 pos : POSITION;
    float size;
    float timelife;
    float3 color;
};

/* Example of default shader input. */
// Warning: Do not change layout of this structure!
struct DefaultShaderInput {
    float3 pos;
    float4 color : COLOR0;
    float  size : SIZE;
};

int Spawn()
{
    return 1;
}

void init(out Part part, int partId)
{
    part.pos = parentPosition + float3(0.f, float2(0.0).x, 0.0);
    part.size = 10.f;
    part.timelife = 0.0;
    part.speed = RndVUnitConus(float3(0.f, 1.f, 0.f), 60.f, partId);
    part.color = RndVUnitConus(float3(0.f, 1.f, 0.f), 180.f, partId);
}

/** Return false if you want to kill particle. */
bool update(inout Part part)
{
    part.pos = parentPosition + part.speed * part.timelife * 15.0f;
    part.timelife = (part.timelife + elapsedTime / 3.0f);
    return part.timelife < 1.5f;
}

struct PartLight {
   float3 pos;
   float radius;
   float3 color;
   float attenuation;
   float viewZ;
   int camIdx;
   bool isFpView;
   bool isAdaptiveIntensity;
};


void prerender(inout Part part, inout PartLight input)
{
    input.pos.xyz = part.pos.xyz;
    input.radius = part.size;
    input.color = abs(part.color);
    input.attenuation = 3.f;
    input.viewZ = 0.f;
    input.camIdx = 0x0;
    input.isFpView = false;
    input.isAdaptiveIntensity = true;
}



partFx light {
    Capacity = 512;
    SpawnRoutine = compile Spawn();
    InitRoutine = compile init();
    UpdateRoutine = compile update();

    pass P0 {
        Sorting = FALSE;
        PrerenderRoutine = compile prerender();
    }
}

