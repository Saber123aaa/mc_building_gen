"""Run from any directory: python -X utf8 web/test/baroque_python.py."""
from pathlib import Path
import json,sys,tempfile,gzip,subprocess
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT))
from generate import generate
from mcgen.baroque import build_baroque
spec=json.loads((ROOT/'specs/baroque.json').read_text(encoding='utf8'))
with tempfile.TemporaryDirectory(prefix='mcgen-baroque-') as tmp:
    tmp=Path(tmp);result=generate(spec,tmp/'from-cli.schem')
    assert result[2]==(139,99,121,220246)
    model=build_baroque(spec);assert model.placement['total']==0
    model.save_schem(tmp/'from-structure.schem',data_version=3465)
    assert gzip.decompress((tmp/'from-cli.schem').read_bytes())==gzip.decompress((tmp/'from-structure.schem').read_bytes())
    subprocess.run([sys.executable,'-X','utf8',str(ROOT/'generate.py'),str(ROOT/'specs/baroque.json'),str(tmp/'external.schem')],cwd=tmp,check=True)
print('Baroque Python CLI, Structure API and external working directory passed.')
