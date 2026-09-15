"""
Word prediction using pyspellchecker + frequency-based suggestions.
Returns top 3 completions for the current word being typed.
"""

from spellchecker import SpellChecker
import re

spell = SpellChecker()

# Common English words sorted by frequency for better suggestions
COMMON_WORDS = [
    "the","be","to","of","and","a","in","that","have","it","for","not","on","with",
    "he","as","you","do","at","this","but","his","by","from","they","we","say","her",
    "she","or","an","will","my","one","all","would","there","their","what","so","up",
    "out","if","about","who","get","which","go","me","when","make","can","like","time",
    "no","just","him","know","take","people","into","year","your","good","some","could",
    "them","see","other","than","then","now","look","only","come","its","over","think",
    "also","back","after","use","two","how","our","work","first","well","way","even",
    "new","want","because","any","these","give","day","most","us","great","between",
    "need","large","often","hand","high","place","hold","turn","help","start","never",
    "next","hard","open","seem","together","example","begin","life","always","those",
    "both","paper","together","got","group","often","run","important","until","children",
    "side","feet","car","mile","night","walk","white","sea","began","grow","took","river",
    "four","carry","state","once","book","hear","stop","without","second","later","miss",
    "idea","enough","eat","face","watch","far","indian","real","almost","let","above",
    "girl","sometimes","mountain","cut","young","talk","soon","list","song","being","leave",
    "family","body","music","color","stand","sun","questions","fish","area","mark","dog",
    "horse","birds","problem","complete","room","knew","since","ever","piece","told",
    "usually","didn","friends","easy","heard","order","red","door","sure","become",
    "top","ship","across","today","during","short","better","best","however","low",
    "hours","black","products","happened","whole","measure","remember","early","waves",
    "reached","listen","wind","rock","space","covered","fast","several","hold","himself",
    "toward","five","step","morning","passed","vowel","true","hundred","against","pattern",
    "numeral","table","north","slowly","money","map","farm","pulled","draw","voice",
    "power","town","fine","drive","led","cry","dark","machine","note","waiting","plan",
    "figure","star","box","noun","field","rest","able","pound","done","beauty","drive",
    "stood","contain","front","teach","week","final","gave","green","oh","quick","develop",
    "ocean","warm","free","minute","strong","special","mind","behind","clear","tail","produce",
    "fact","street","inch","multiply","nothing","course","stay","wheel","full","force","blue",
    "object","decide","surface","deep","moon","island","foot","system","busy","test","record",
    "boat","common","gold","possible","plane","stead","dry","wonder","laugh","thousand","ago",
    "ran","check","game","shape","equate","hot","miss","brought","heat","snow","tire","bring",
    "yes","distant","fill","east","paint","language","among","grand","ball","yet","wave",
    "drop","heart","am","present","heavy","dance","engine","position","arm","wide","sail",
    "material","size","vary","settle","speak","weight","general","ice","matter","circle",
    "pair","include","divide","syllable","felt","perhaps","pick","sudden","count","square",
    "reason","length","represent","art","subject","region","energy","hunt","probable","bed",
    "brother","egg","ride","cell","believe","fraction","forest","sit","race","window","store",
    "summer","train","sleep","prove","lone","leg","exercise","wall","catch","mount","wish",
    "sky","board","joy","winter","sat","written","wild","instrument","kept","glass","grass",
    "cow","job","edge","sign","visit","past","soft","fun","bright","gas","weather","month",
    "million","bear","finish","happy","hope","flower","clothe","strange","gone","jump","baby",
    "eight","village","meet","root","buy","raise","solve","metal","whether","push","seven",
    "paragraph","third","shall","held","hair","describe","cook","floor","either","result",
    "burn","hill","safe","cat","century","consider","type","law","bit","coast","copy","phrase",
    "silent","tall","sand","soil","roll","temperature","finger","industry","value","fight",
    "lie","beat","excite","natural","view","sense","ear","else","quite","broke","case","middle",
    "kill","son","lake","moment","scale","loud","spring","observe","child","straight","consonant",
    "nation","dictionary","milk","speed","method","organ","pay","age","section","dress","cloud",
    "surprise","quiet","stone","tiny","climb","cool","design","poor","lot","experiment","bottom",
    "key","iron","single","stick","flat","twenty","skin","smile","crease","hole","trade","melody",
    "trip","office","receive","row","mouth","exact","symbol","die","least","trouble","shout",
    "except","wrote","seed","tone","join","suggest","clean","break","lady","yard","rise","bad",
    "blow","oil","blood","touch","grew","cent","mix","team","wire","cost","lost","brown","wear",
    "garden","equal","sent","choose","fell","fit","flow","fair","bank","collect","save","control",
    "decimal","gentle","woman","captain","practice","separate","difficult","doctor","please",
    "protect","noon","whose","locate","ring","character","insect","caught","period","indicate",
    "radio","spoke","atom","human","history","effect","electric","expect","crop","modern","element",
    "hit","student","corner","party","supply","bone","rail","imagine","provide","agree","thus",
    "capital","chair","danger","fruit","rich","thick","soldier","process","operate","guess",
    "necessary","sharp","wing","create","neighbor","wash","bat","rather","crowd","corn","compare",
    "poem","string","bell","depend","meat","rub","tube","famous","dollar","stream","fear","sight",
    "thin","triangle","planet","hurry","chief","colony","clock","mine","tie","enter","major",
    "fresh","search","send","yellow","gun","allow","print","dead","spot","desert","suit","current",
    "lift","rose","continue","block","chart","hat","sell","success","company","subtract","event",
    "particular","deal","swim","term","opposite","wife","shoe","shoulder","spread","arrange",
    "camp","invent","cotton","born","determine","quart","nine","truck","noise","level","chance",
    "gather","shop","stretch","throw","shine","property","column","molecule","select","wrong",
    "gray","repeat","require","broad","prepare","salt","nose","plural","anger","claim","continent",
    "oxygen","sugar","death","pretty","skill","women","season","solution","magnet","silver",
    "thank","branch","match","suffix","especially","fig","afraid","huge","sister","steel",
    "discuss","forward","similar","guide","experience","score","apple","bought","led","pitch",
    "coat","mass","card","band","rope","slip","win","dream","evening","condition","feed","tool",
    "total","basic","smell","valley","nor","double","seat","arrive","master","track","parent",
    "shore","division","sheet","substance","favor","connect","post","spend","chord","fat","glad",
    "original","share","station","dad","bread","charge","proper","bar","offer","segment","slave",
    "duck","instant","market","degree","populate","chick","dear","enemy","reply","drink","occur",
    "support","speech","nature","range","steam","motion","path","liquid","log","meant","quotient",
    "teeth","shell","neck"
]

WORD_SET = set(COMMON_WORDS)


def get_predictions(current_word: str, n: int = 3) -> list:
    """
    Given the current partial word being typed, return top N completions.
    e.g. "hel" → ["hello", "help", "held"]
    """
    if not current_word or len(current_word) < 1:
        return []

    w = current_word.lower().strip()

    # Exact prefix matches from common words first
    prefix_matches = [word for word in COMMON_WORDS if word.startswith(w) and word != w]

    # Also get spell-checker candidates
    try:
        candidates = list(spell.candidates(w) or [])
        spell_matches = [c for c in candidates if c.startswith(w) and c != w]
    except Exception:
        spell_matches = []

    # Combine, deduplicate, preserve order
    seen = set()
    results = []
    for word in prefix_matches + spell_matches:
        if word not in seen and len(word) > len(w):
            seen.add(word)
            results.append(word)
        if len(results) >= n:
            break

    # If not enough, add spell corrections (even if not prefix)
    if len(results) < n:
        try:
            correction = spell.correction(w)
            if correction and correction != w and correction not in seen:
                results.append(correction)
        except Exception:
            pass

    return results[:n]


def get_current_word(text: str) -> str:
    """Extract the word currently being typed (last word fragment)."""
    if not text:
        return ""
    # Get last word — split on spaces, newlines, punctuation
    parts = re.split(r'[\s\.,!?;:\-\(\)\[\]]+', text)
    return parts[-1] if parts else ""
